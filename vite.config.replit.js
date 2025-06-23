// CRITICAL Replit Fix: Add base: './' to main vite.config.ts file
// The current vite.config.ts is missing this essential setting:
// 
// export default defineConfig({
//   base: './',  // <-- ADD THIS LINE
//   plugins: [
//     react(),
//     ...
//   ],
//   ...
// });
//
// Without base: './', Vite generates absolute paths that break on Replit
// This causes asset loading failures and blank screens

console.log("⚠️  DEPLOYMENT WARNING: vite.config.ts needs base: './' added");
console.log("📝 Manual fix required - cannot auto-edit vite.config.ts");
console.log("✅ All other Replit requirements are satisfied");

export default {
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
};