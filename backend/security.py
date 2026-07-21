import re
import hashlib
import time
import json
from datetime import datetime, timezone
from flask import request, jsonify, make_response
from functools import wraps

class SecurityMiddleware:
    def __init__(self, app=None):
        self.app = app
        self.ip_blacklist = {}
        self.login_attempts = {}
        self.honeypot_captures = []
        self.attack_log = []
        
        self.SQL_INJECTION_PATTERNS = [
            r"(?i)(UNION\s+(?:ALL\s+)?SELECT\s+)",
            r"(?i)(SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+)",
            r"(?i)(INSERT\s+INTO\s+.*\s+VALUES\s*)",
            r"(?i)(UPDATE\s+.*\s+SET\s+.*\s+WHERE\s+)",
            r"(?i)(DELETE\s+FROM\s+.*\s+WHERE\s+)",
            r"(?i)(DROP\s+(?:TABLE|DATABASE|INDEX)\s+)",
            r"(?i)(EXEC(?:UTE)?\s*\(|XP_\w+)",
            r"(?i)(0x[0-9a-f]{8,})",
            r"(?i)(/\*!?\d*\*/|\*/)",
            r"(?i)(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1|OR\s+'?1'?\s*=\s*'?1|AND\s+'?1'?\s*=\s*'?1)",
            r"(?i)(BENCHMARK\s*\(|SLEEP\s*\(|WAITFOR\s+DELAY\s+|PG_SLEEP\s*\()",
            r"(?i)(information_schema\.)",
            r"(?i)(CONCAT\s*\(|SUBSTRING\s*\(|UNHEX\s*\(|CHAR\s*\(\s*\d+\s*\))",
            r"(?i)('\s*OR\s*'?\d|'\s*AND\s*'?\d|'\s*--|'\s*;)",
            r"(?i)(\(\s*SELECT\s+.*\s+FROM\s+)",
            r"(?i)(LOAD_FILE\s*\(|INTO\s+OUTFILE\s+|INTO\s+DUMPFILE\s+)",
        ]

        self.XSS_PATTERNS = [
            r"(?i)<script[^>]*>.*?</script>",
            r"(?i)<script[^>]*>",
            r"(?i)</script>",
            r"(?i)<iframe[^>]*>",
            r"(?i)<img[^>]*src\s*=\s*[\"']?\s*javascript:",
            r"(?i)javascript\s*:",
            r"(?i)vbscript\s*:",
            r"(?i)data\s*:\s*text/html",
            r"(?i)<svg[^>]*on\w+\s*=",
            r"(?i)<body[^>]*onload\s*=",
            r"(?i)<link[^>]*href\s*=\s*[\"']?\s*javascript:",
            r"(?i)expression\s*\(",
            r"(?i)<object[^>]*>",
            r"(?i)<embed[^>]*>",
        ]
        
        self.HONEYPOT_ROUTES = [
            '/wp-admin/', '/wp-login.php', '/admin/', '/login.php', '/phpmyadmin/',
            '/mysqladmin/', '/adminer/', '/manager/html', '/.env', '/config.php',
            '/api/v1/auth', '/api/login', '/oauth/token', '/token', '/auth/token',
            '/api/secret', '/.git/config', '/server-status', '/cgi-bin/',
            '/shell.php', '/cmd.php', '/backdoor.php', '/webshell.php',
        ]
        
        self.RATE_LIMITS = {
            'login': {'max_attempts': 5, 'window_seconds': 300, 'lockout_seconds': 1800},
            'api': {'max_requests': 100, 'window_seconds': 60},
            'guestbook': {'max_requests': 5, 'window_seconds': 60},
        }
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        self.app = app
        app.before_request(self._security_check)
        app.after_request(self._add_security_headers)
    
    def _get_client_ip(self):
        ip = request.headers.get('X-Forwarded-For', '').split(',')[0].strip()
        if not ip:
            ip = request.headers.get('X-Real-IP', '').strip()
        if not ip:
            ip = request.remote_addr or ''
        return ip
    
    def _log_attack(self, attack_type, details):
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'ip': self._get_client_ip(),
            'user_agent': request.headers.get('User-Agent', ''),
            'path': request.path,
            'method': request.method,
            'attack_type': attack_type,
            'details': details,
        }
        self.attack_log.append(log_entry)
        if len(self.attack_log) > 1000:
            self.attack_log = self.attack_log[-500:]
        
        if self.app:
            self.app.logger.warning(f"[SECURITY] {attack_type}: {json.dumps(details)}")
    
    def _is_ip_blacklisted(self, ip):
        if ip in self.ip_blacklist:
            if self.ip_blacklist[ip]['expires'] > time.time():
                return True
            else:
                del self.ip_blacklist[ip]
        return False
    
    def _blacklist_ip(self, ip, duration_seconds=3600):
        self.ip_blacklist[ip] = {
            'expires': time.time() + duration_seconds,
            'reason': 'Automatic blacklist due to malicious activity',
        }
        self._log_attack('IP_BLACKLISTED', {'ip': ip, 'duration': duration_seconds})
    
    def _detect_sql_injection(self, data):
        if not data:
            return False
        text = str(data).lower()
        for pattern in self.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _detect_xss(self, data):
        if not data:
            return False
        text = str(data)
        for pattern in self.XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _check_rate_limit(self, key, max_requests, window_seconds):
        now = time.time()
        if key not in self.login_attempts:
            self.login_attempts[key] = {'count': 0, 'first_time': now}
        
        attempts = self.login_attempts[key]
        
        if now - attempts['first_time'] > window_seconds:
            attempts['count'] = 1
            attempts['first_time'] = now
            return True
        
        if attempts['count'] >= max_requests:
            return False
        
        attempts['count'] += 1
        return True
    
    def _check_login_attempts(self, username, ip):
        key = f"login_{username}_{ip}"
        now = time.time()
        
        if key not in self.login_attempts:
            self.login_attempts[key] = {
                'count': 0,
                'first_time': now,
                'locked_until': 0,
            }
        
        attempts = self.login_attempts[key]
        
        if attempts['locked_until'] > now:
            remaining = int(attempts['locked_until'] - now)
            return False, f"账户已锁定，请 {remaining} 秒后再试"
        
        if now - attempts['first_time'] > self.RATE_LIMITS['login']['window_seconds']:
            attempts['count'] = 1
            attempts['first_time'] = now
            return True, None
        
        attempts['count'] += 1
        
        if attempts['count'] >= self.RATE_LIMITS['login']['max_attempts']:
            attempts['locked_until'] = now + self.RATE_LIMITS['login']['lockout_seconds']
            self._log_attack('BRUTE_FORCE_ATTEMPT', {'username': username, 'ip': ip})
            return False, f"登录失败次数过多，账户已锁定，请 {self.RATE_LIMITS['login']['lockout_seconds']} 秒后再试"
        
        return True, None
    
    def _check_honeypot(self):
        path = request.path.lower()
        for route in self.HONEYPOT_ROUTES:
            if path.startswith(route) or path == route:
                capture = {
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'ip': self._get_client_ip(),
                    'path': request.path,
                    'method': request.method,
                    'user_agent': request.headers.get('User-Agent', ''),
                    'referer': request.headers.get('Referer', ''),
                    'query_string': request.query_string.decode('utf-8', errors='ignore'),
                }
                self.honeypot_captures.append(capture)
                if len(self.honeypot_captures) > 500:
                    self.honeypot_captures = self.honeypot_captures[-250:]
                
                self._log_attack('HONEYPOT_TRIGGERED', capture)
                self._blacklist_ip(self._get_client_ip(), duration_seconds=7200)
                return True, capture
        
        return False, None
    
    def _security_check(self):
        ip = self._get_client_ip()
        
        if self._is_ip_blacklisted(ip):
            return jsonify({
                'success': False,
                'message': '您的IP地址已被暂时封禁',
            }), 403
        
        triggered, capture = self._check_honeypot()
        if triggered:
            if request.path.startswith('/api/'):
                return jsonify({
                    'success': True,
                    'message': '欢迎访问管理接口',
                    'data': {'status': 'connected', 'version': '1.0.0'},
                }), 200
            return make_response("404 Not Found", 404)
        
        data = ''
        try:
            if request.method in ('POST', 'PUT', 'DELETE'):
                if request.is_json:
                    data = json.dumps(request.get_json(silent=True) or {})
                else:
                    data = request.get_data(as_text=True) or ''
            else:
                data = request.query_string.decode('utf-8', errors='ignore')
        except:
            pass
        
        if self._detect_sql_injection(data):
            self._log_attack('SQL_INJECTION_DETECTED', {'data': data[:200]})
            return jsonify({
                'success': False,
                'message': '请求参数包含非法内容',
            }), 400

        if self._detect_xss(data):
            self._log_attack('XSS_ATTACK_DETECTED', {'data': data[:200]})
            return jsonify({
                'success': False,
                'message': '请求参数包含非法内容',
            }), 400
        
        if request.path.startswith('/api/') and request.method != 'GET':
            api_key = f"api_{ip}"
            if not self._check_rate_limit(api_key, 
                self.RATE_LIMITS['api']['max_requests'],
                self.RATE_LIMITS['api']['window_seconds']):
                return jsonify({
                    'success': False,
                    'message': '请求过于频繁，请稍后再试',
                }), 429
        
        if request.path == '/api/auth/login':
            try:
                json_data = request.get_json(silent=True) or {}
                username = json_data.get('username', '')
                allowed, msg = self._check_login_attempts(username, ip)
                if not allowed:
                    return jsonify({'success': False, 'message': msg}), 429
            except:
                pass
        
        return None
    
    def _add_security_headers(self, response):
        headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()',
        }
        
        for key, value in headers.items():
            response.headers.setdefault(key, value)
        
        return response
    
    def get_security_stats(self):
        return {
            'blacklisted_ips': len(self.ip_blacklist),
            'total_attacks': len(self.attack_log),
            'honeypot_captures': len(self.honeypot_captures),
            'recent_attacks': self.attack_log[-10:],
        }
    
    def clear_blacklist(self):
        self.ip_blacklist.clear()
        return {'success': True, 'message': '黑名单已清空'}
    
    def whitelist_ip(self, ip):
        if ip in self.ip_blacklist:
            del self.ip_blacklist[ip]
            return {'success': True, 'message': f'IP {ip} 已从黑名单移除'}
        return {'success': False, 'message': f'IP {ip} 不在黑名单中'}


security = SecurityMiddleware()

def create_csrf_token():
    token = hashlib.sha256(f"{time.time()}{request.remote_addr}".encode()).hexdigest()[:32]
    return token

def csrf_protected(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'DELETE'):
            csrf_token = request.headers.get('X-CSRF-Token', '')
            session_token = getattr(request, 'csrf_token', '')
            
            if not csrf_token or csrf_token != session_token:
                return jsonify({'success': False, 'message': 'CSRF token 无效'}), 403
        
        return fn(*args, **kwargs)
    return wrapper

def slow_response(delay=1):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            time.sleep(delay)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
