// Clear localStorage script
// Run this in browser console if you encounter localStorage errors

if (typeof window !== 'undefined') {
  console.log('Clearing localStorage...')
  localStorage.clear()
  console.log('localStorage cleared! Please refresh the page.')
}
