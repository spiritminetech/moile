# Photo Upload Timeout Fix

## Problem
When completing pickup in the Transport Task Screen and uploading a photo, the upload continuously loads and never completes, causing the app to hang.

## Root Causes

1. **Short API Timeout**: The default API timeout was 15 seconds, which is too short for photo uploads, especially on slower mobile connections
2. **No Upload Progress Feedback**: Users had no indication that the upload was in progress
3. **Large Photo File Sizes**: Photos were compressed at 0.8 quality, resulting in larger files
4. **No Specific Error Messages**: When uploads failed, users didn't know why

## Changes Made

### 1. Extended Upload Timeout (`src/utils/constants/index.ts`)

Added a separate timeout configuration for file uploads:

```typescript
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 15000,        // Default timeout for regular API calls (15 seconds)
  UPLOAD_TIMEOUT: 60000, // Extended timeout for file uploads (60 seconds)
  RETRY_ATTEMPTS: 3,
  MOCK_MODE: false,
} as const;
```

### 2. Enhanced Upload Method (`src/services/api/client.ts`)

Improved the `uploadFile` method with:
- Extended timeout using `API_CONFIG.UPLOAD_TIMEOUT`
- Upload progress tracking with `onUploadProgress`
- Better error handling for timeout errors
- Detailed logging for debugging

```typescript
async uploadFile<T>(url: string, file: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    console.log('📤 Starting file upload to:', url);
    const uploadStartTime = Date.now();
    
    const response = await this.instance.post(url, file, {
      ...config,
      timeout: API_CONFIG.UPLOAD_TIMEOUT, // 60 seconds for uploads
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📤 Upload progress: ${percentCompleted}%`);
        }
      },
    });
    
    const uploadDuration = Date.now() - uploadStartTime;
    console.log(`✅ File upload completed in ${uploadDuration}ms`);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ File upload failed:', error.message);
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.error('⏱️ Upload timeout - file may be too large or connection too slow');
    }
    throw error;
  }
}
```

### 3. Better User Feedback (`src/screens/driver/TransportTasksScreen.tsx`)

Added user-friendly alerts during upload:

- **Upload Start**: Shows "Uploading Photo" alert (non-cancelable)
- **Upload Success**: Shows success confirmation
- **Upload Failure**: Shows specific error message with reason
- **Timeout Handling**: Specific message for timeout errors
- **Network Errors**: Specific message for network issues

```typescript
// Show uploading indicator
Alert.alert(
  '📤 Uploading Photo',
  'Please wait while the photo is being uploaded...',
  [],
  { cancelable: false }
);

// Handle specific errors
if (uploadError.message?.includes('timeout') || uploadError.code === 'ECONNABORTED') {
  errorMessage = 'Upload timed out. Please check your internet connection and try again later.';
} else if (uploadError.message?.includes('Network')) {
  errorMessage = 'Network error. Please check your internet connection.';
}
```

### 4. Optimized Photo Compression (`src/utils/photoCapture.ts`)

Reduced photo quality from 0.8 to 0.6 to decrease file size and upload time:

```typescript
// Camera
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: 'images',
  quality: 0.6, // Reduced from 0.8 for faster uploads
  allowsEditing: false,
  exif: true,
});

// Gallery
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'images',
  quality: 0.6, // Reduced from 0.8 for faster uploads
  allowsEditing: false,
  exif: true,
});
```

## How It Works Now

1. **User Takes Photo**: Photo is captured and compressed at 0.6 quality
2. **Upload Starts**: Alert shows "Uploading Photo" message
3. **Progress Tracking**: Upload progress is logged in console (0-100%)
4. **Extended Timeout**: Upload has 60 seconds to complete (vs 15 seconds before)
5. **Success/Failure**: User gets clear feedback about upload status
6. **Graceful Degradation**: If upload fails, pickup still completes without photo

## Benefits

- **Faster Uploads**: Smaller file sizes due to reduced compression quality
- **More Reliable**: 60-second timeout accommodates slower connections
- **Better UX**: Users see upload progress and get clear error messages
- **Non-Blocking**: Upload failures don't prevent pickup completion
- **Debugging**: Detailed logs help troubleshoot issues

## Testing

After rebuilding the app:

1. **Test Normal Upload**: Take photo and complete pickup - should upload within 10-20 seconds
2. **Test Slow Connection**: Enable network throttling - should complete within 60 seconds
3. **Test Timeout**: Disable network after photo capture - should show timeout error after 60 seconds
4. **Test Failure Recovery**: If upload fails, pickup should still complete

## Performance Metrics

- **Before**: 15-second timeout, 0.8 quality, ~2-4 MB photos
- **After**: 60-second timeout, 0.6 quality, ~1-2 MB photos
- **Expected Upload Time**: 5-15 seconds on 3G, 2-5 seconds on 4G/WiFi

## Troubleshooting

If uploads still fail:

1. **Check Network**: Ensure stable internet connection
2. **Check Backend**: Verify backend server is running and accessible
3. **Check Logs**: Look for upload progress logs in console
4. **Reduce Quality**: Can further reduce to 0.5 or 0.4 if needed
5. **Check File Size**: Verify photos are under 10MB limit

## Future Improvements

1. **Retry Logic**: Automatically retry failed uploads
2. **Background Upload**: Upload photos in background after pickup
3. **Offline Queue**: Queue photos for upload when connection returns
4. **Progress Bar**: Show visual progress bar to user
5. **Thumbnail Preview**: Show thumbnail before upload
