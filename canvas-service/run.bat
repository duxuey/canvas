@echo off
cd /d D:\work\project\canvas-service
set /p JARS=<cp.txt
set TARGET=canvas-app	arget\classes;canvas-core	arget\classes;canvas-api	arget\classes
set CP=%TARGET%;%JARS%
java -cp "%CP%" -Dfile.encoding=UTF-8 com.hundsun.bontal.CanvasServiceStarter
