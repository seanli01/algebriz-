@echo OFF

@REM production server (SSH public key authnetication)
set SERVER=34.130.93.195

@REM names of the image files
set FRONTEND_IMAGE_FILE=image_frontend.tar
set BACKEND_IMAGE_FILE=image_backend.tar

@REM build frontend, save to file, and send file to server
docker build -t frontend -f frontend.dockerfile .
echo.
echo Saving frontend image to %FRONTEND_IMAGE_FILE% ...
docker save frontend -o %FRONTEND_IMAGE_FILE%
echo Loading frontend image to server...
scp %FRONTEND_IMAGE_FILE% %SERVER%:.
ssh %SERVER% docker load -i %FRONTEND_IMAGE_FILE% 
echo Finished loading frontend to server

@REM build backend, save to file, and send file to server
docker build -t backend -f backend.dockerfile .
echo.
echo Saving backend image to %BACKEND_IMAGE_FILE% ...
docker save backend -o %BACKEND_IMAGE_FILE%
echo Loading backend image to server...
scp %BACKEND_IMAGE_FILE% %SERVER%:.
ssh %SERVER% docker load -i %BACKEND_IMAGE_FILE% 
echo Finished loading backend to server

@REM stop all containers on server
ssh %SERVER% docker compose down --remove-orphans

@REM copy docker-compose and .env
scp docker-compose.yml %SERVER%:.
scp .env %SERVER%:.

@REM restart all containers
ssh %SERVER% docker compose up -d

@REM remove dangling images and .tar files locally
docker image prune -f
ssh %SERVER% docker image prune -f
del %FRONTEND_IMAGE_FILE%
del %BACKEND_IMAGE_FILE% 

cmd.exe