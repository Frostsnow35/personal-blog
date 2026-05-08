<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-ocean-500/25 via-indigo-500/10 to-transparent blur-3xl animate-[float1_14s_ease-in-out_infinite]" />
    <div class="absolute top-24 -right-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-fuchsia-500/20 via-sea-500/10 to-transparent blur-3xl animate-[float2_18s_ease-in-out_infinite]" />
    <div class="absolute -bottom-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-gradient-to-br from-emerald-400/15 via-ocean-500/10 to-transparent blur-3xl animate-[float3_22s_ease-in-out_infinite]" />
    <div class="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] mix-blend-overlay bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.5)_1px,transparent_0)] [background-size:18px_18px]" />
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
</style>
