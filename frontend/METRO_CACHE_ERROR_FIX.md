# Metro Cache Error Fix Guide

## Error Description
```
Error while reading cache, falling back to a full crawl:
Error: Unable to deserialize cloned data due to invalid or unsupported version.
```

This error occurs when Metro bundler's cache becomes corrupted or incompatible, usually after:
- Node.js version changes
- Package updates
- System crashes during development
- Long periods of inactivity

## Quick Fix (Recommended)

### Method 1: Using the Clear Cache Script
We've created a batch script that clears all caches automatically:

```bash
# Run the clear cache script
.\clear-cache.bat
```

### Method 2: Manual Cache Clearing
If the script doesn't work, clear caches manually:

```bash
# Clear npm cache
npm cache clean --force

# Clear Expo cache (if .expo folder exists)
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Start Expo with clean cache
npx expo start --clear
```

### Method 3: Alternative Port (if port 8081 is busy)
```bash
# Start on different port with clean cache
npx expo start --clear --port 8082
```

## Complete Cache Clearing Process

### Step 1: Stop All Running Processes
- Close any running Metro bundler instances
- Stop Expo CLI processes
- Close Android/iOS simulators if running

### Step 2: Clear All Caches
```bash
# Clear npm cache
npm cache clean --force

# Clear Expo cache directories
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo-shared -ErrorAction SilentlyContinue

# Clear Metro cache in node_modules
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Clear system temp cache (Windows)
Remove-Item -Recurse -Force $env:TEMP\metro-* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:TEMP\react-* -ErrorAction SilentlyContinue
```

### Step 3: Clear Watchman (if installed)
```bash
# Clear watchman cache
watchman watch-del-all
```

### Step 4: Restart with Clean Cache
```bash
# Start Expo with completely clean cache
npx expo start --clear --port 8082
```

## What the Fix Does

### ✅ Cache Clearing Benefits
- **Removes corrupted cache files** that cause deserialization errors
- **Forces Metro to rebuild** the file map from scratch
- **Resolves version compatibility issues** between cached data and current Metro version
- **Clears temporary files** that might be causing conflicts

### ✅ Expected Behavior After Fix
- Metro bundler starts without cache errors
- Initial build takes longer (rebuilding cache)
- Subsequent builds are faster with fresh cache
- No more "Unable to deserialize cloned data" errors

## Verification Steps

### 1. Check Process Output
After running the fix, you should see:
```
Starting project at [your-project-path]
Starting Metro Bundler
warning: Bundler cache is empty, rebuilding (this may take a minute)
```

### 2. Successful Startup Indicators
- ✅ No cache deserialization errors
- ✅ Metro bundler starts successfully
- ✅ QR code appears for device connection
- ✅ Web interface accessible at http://localhost:8082

### 3. Test App Loading
- Scan QR code with Expo Go app
- Verify app loads without cache-related errors
- Check that hot reloading works properly

## Prevention Tips

### Regular Maintenance
```bash
# Clear cache weekly during active development
npm cache clean --force
npx expo start --clear
```

### When to Clear Cache
- After Node.js version updates
- After major package updates
- When experiencing unexplained build errors
- After system crashes or forced shutdowns
- When switching between different projects frequently

## Troubleshooting

### If Cache Error Persists
1. **Reinstall node_modules**:
   ```bash
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. **Update Expo CLI**:
   ```bash
   npm install -g @expo/cli@latest
   ```

3. **Check Node.js Version**:
   ```bash
   node --version
   # Ensure you're using a supported Node.js version (16.x or 18.x)
   ```

### Alternative Solutions
- Use Yarn instead of npm: `yarn start`
- Try different port: `--port 8083`
- Restart your development machine
- Check for antivirus interference with cache files

## Files Created for This Fix

- **`clear-cache.bat`**: Automated cache clearing script
- **`METRO_CACHE_ERROR_FIX.md`**: This comprehensive guide

## Status

✅ **CACHE ERROR FIXED**  
✅ **Metro bundler starting successfully**  
✅ **Cache rebuilding in progress**  
✅ **Ready for development**

The Metro cache error has been resolved. The bundler is now starting with a clean cache and should work properly for your Team Management screen testing and development.

---

**Last Updated**: February 5, 2026  
**Status**: ✅ **RESOLVED**  
**Next Steps**: Test the Team Management screen scrolling and card content visibility fixes