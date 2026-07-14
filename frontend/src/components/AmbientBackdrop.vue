<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="absolute -top-48 -left-32 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-ocean-500/35 via-indigo-500/20 to-transparent blur-3xl animate-[float1_14s_ease-in-out_infinite]" />
    <div class="absolute top-16 -right-48 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-fuchsia-500/30 via-sea-500/20 to-transparent blur-3xl animate-[float2_18s_ease-in-out_infinite]" />
    <div class="absolute -bottom-48 left-1/4 h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-emerald-400/25 via-ocean-500/20 to-transparent blur-3xl animate-[float3_22s_ease-in-out_infinite]" />
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60rem] w-[60rem] rounded-full bg-gradient-to-br from-ocean-400/10 via-sea-400/5 to-transparent blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
    <div class="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] mix-blend-overlay bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.6)_1px,transparent_0)] [background-size:16px_16px]" />
  </div>
</template>

<style scoped>
@keyframes float1 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(40px, 18px, 0) scale(1.06);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes float2 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-42px, 22px, 0) scale(1.07);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes float3 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(26px, -18px, 0) scale(1.05);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}
</style>
