@echo off

REM Set image name and Google Container Registry (GCR) image name
set IMAGE_NAME=chat-frontend
set GCR_IMAGE_NAME=gcr.io/ai-chat-496106/%IMAGE_NAME%

REM Ask for confirmation
set /p CONFIRM=Do you really want to build and push the Docker image to Google Cloud Run container? (y/n): 
if /i "%CONFIRM%" neq "y" goto :cancel

echo Building the Docker image with local environment variables...
REM Load environment variables from .env.local file if it exists
if exist .env.local (
    for /f "usebackq tokens=*" %%a in (`type .env.local ^| findstr /v "^#"`) do set %%a
)

docker buildx build --platform linux/amd64 ^
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="%NEXT_PUBLIC_FIREBASE_API_KEY%" ^
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="%NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN%" ^
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="%NEXT_PUBLIC_FIREBASE_PROJECT_ID%" ^
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="%NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET%" ^
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="%NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID%" ^
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="%NEXT_PUBLIC_FIREBASE_APP_ID%" ^
  --build-arg NEXT_PUBLIC_SOCKET_URL="%NEXT_PUBLIC_SOCKET_URL%" ^
  -t %GCR_IMAGE_NAME% --load .
if %ERRORLEVEL% neq 0 (
    echo Docker build failed. Exiting.
    exit /b 1
)

echo Docker image built successfully.

echo Pushing the Docker image to %GCR_IMAGE_NAME%...
docker push %GCR_IMAGE_NAME%
if %ERRORLEVEL% neq 0 (
    echo Docker push failed. Exiting.
    exit /b 1
)

echo Deploying %IMAGE_NAME% to Google Cloud Run managed platform...
gcloud run deploy %IMAGE_NAME% ^
    --port 3000 ^
    --image %GCR_IMAGE_NAME% ^
    --platform managed ^
    --region us-central1 ^
    --allow-unauthenticated
if %ERRORLEVEL% neq 0 (
    echo Deployment to Google Cloud Run failed. Exiting.
    exit /b 1
)

echo Deployment to Google Cloud Run successful!
goto :eof

:cancel
echo Build and push cancelled.
