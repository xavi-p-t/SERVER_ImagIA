# Leer las líneas del archivo config.env
$configFile = "config.env"
Get-Content $configFile | ForEach-Object {
    $line = $_
    if ($line -match "(\S+)\s*=\s*(.+)") {
        $key = $matches[1]
        $value = $matches[2]

        if ($value -like "*HOME*") {
            $value = $value -replace "HOME", "$HOME"
            $value = $value -replace '\$', ''
        }

        # Reemplazar las barras y eliminar comillas en valores
        $value = $value -replace '/', '\'
        $value = $value -replace '"', ''

        # Configurar la variable en PowerShell
        Set-Variable -Name $key -Value $value
    }
}

# Parámetros por defecto
$DEFAULT_USER = "imagia1"
$DEFAULT_RSA_PATH = "$HOME\.ssh\id_rsa"
$DEFAULT_SERVER_PORT = 20127

# Leer argumentos o usar valores por defecto
$USER = if ($args.Count -ge 1) { $args[0] } else { $DEFAULT_USER }
$RSA_PATH = if ($args.Count -ge 2) { $args[1] } else { $DEFAULT_RSA_PATH }
$SERVER_PORT = if ($args.Count -ge 3) { $args[2] } else { $DEFAULT_SERVER_PORT }

Write-Host "Usuario: $USER"
Write-Host "Ruta RSA: $RSA_PATH"
Write-Host "Puerto del servidor: $SERVER_PORT"

# Empaquetar el proyecto Node.js
$PROJECT_FOLDER = "../api"
$TARGET_FOLDER = "server-package"
$ZIP_NAME = "$TARGET_FOLDER.zip"

Write-Host "Creando archivo ZIP del proyecto..."

# Verificar y eliminar el archivo ZIP si ya existe
if (Test-Path $ZIP_NAME) {
    Write-Host "Eliminando archivo ZIP existente..."
    try {
        Remove-Item -Force $ZIP_NAME
    } catch {
        Write-Host "Error: No se pudo eliminar el archivo ZIP existente: $ZIP_NAME"
        Write-Host $_.Exception.Message
        exit 1
    }
}

# Crear archivo ZIP
try {
    Compress-Archive -Path "$PROJECT_FOLDER\*" -DestinationPath $ZIP_NAME -Force
} catch {
    Write-Host "Error: No se pudo crear el archivo ZIP: $ZIP_NAME"
    Write-Host $_.Exception.Message
    exit 1
}

# Verificar si el archivo ZIP fue creado
if (-Not (Test-Path $ZIP_NAME)) {
    Write-Host "Error: No se pudo crear el archivo ZIP: $ZIP_NAME"
    exit 1
}

# Verificar si el archivo de clave privada existe
if (-Not (Test-Path $RSA_PATH)) {
    Write-Host "Error: No se ha encontrado el archivo de clave privada: $RSA_PATH"
    exit 1
}

# Transferir el archivo ZIP al servidor remoto usando SCP
Write-Host "Transfiriendo $ZIP_NAME al servidor remoto..."
scp -i $RSA_PATH -P $SERVER_PORT $ZIP_NAME "$USER@ieticloudpro.ieti.cat:~/" 

# Verificar el resultado de SCP
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error durante la transferencia SCP"
    exit 1
}

# Comandos para desplegar y ejecutar el proyecto en el servidor remoto
$sshCommandTemplate = @'
cd $HOME
# Cambiar permisos en el directorio de trabajo
sudo chown -R $USER:$USER /home/super/server-package
sudo chmod -R 755 /home/super/server-package

# Descomprimir el archivo ZIP
unzip -o TARGET_ZIP_NAME -d TARGET_FOLDER

# Entrar en el directorio del servidor
cd TARGET_FOLDER

# Instalar dependencias
npm install

# Detener el proceso antiguo si está en ejecución
PID=$(lsof -t -i :3000)
if [ -n "$PID" ]; then
    kill -9 $PID
    echo "Proceso en el puerto 3000 detenido."
else
    echo "No se encontró un proceso en el puerto 3000."
fi

# Iniciar el nuevo proceso
nohup npm start > output.log 2>&1 &
PID=$(ps aux | grep "node app.js" | grep -v "grep" | awk "{print $2}")
echo "Nuevo proceso con PID $PID iniciado."
'@ -replace "`r", ""

# Reemplazar placeholders
$sshCommand = $sshCommandTemplate -replace "TARGET_ZIP_NAME", $ZIP_NAME -replace "TARGET_FOLDER", $TARGET_FOLDER

# Ejecutar comandos SSH en el servidor remoto
Write-Host "Ejecutando comandos SSH en el servidor remoto..."
ssh -i $RSA_PATH -p $SERVER_PORT "$USER@ieticloudpro.ieti.cat" $sshCommand

# Configurar iptables para redirigir tráfico del puerto 80 al 3000 (opcional)
Write-Host "Configurando iptables para redirigir el puerto 80 al 3000..."
ssh -i $RSA_PATH -p $SERVER_PORT "$USER@ieticloudpro.ieti.cat" "sudo iptables-save -t nat | grep -q -- '--dport 80' || sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000"
ssh -i $RSA_PATH -p $SERVER_PORT "$USER@ieticloudpro.ieti.cat" "sudo iptables -t nat -L -n -v"

Write-Host "Despliegue completado. Sesión SSH aún activa."

# Mantener la sesión SSH abierta
ssh -i $RSA_PATH -p $SERVER_PORT "$USER@ieticloudpro.ieti.cat"
