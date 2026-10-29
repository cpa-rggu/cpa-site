# Полный бэкап проекта сайта «Африка. Путь к независимости».
# Запуск (из папки сайта):  powershell -ExecutionPolicy Bypass -File tools\backup.ps1
# Результат: папка backups\backup_ГГГГ-ММ-ДД_ЧЧММ рядом с папкой github (в «D:\Проект сайта\backups»).
# Внутри:
#   site-history.bundle      — весь репозиторий со всей историей правок (из него можно восстановить GitHub-репозиторий)
#   site-files.zip           — файлы сайта как есть сейчас (без служебной папки .git)
#   design-and-sources.zip   — макеты, исходные материалы и задания (всё остальное из «D:\Проект сайта»)
#   ВОССТАНОВЛЕНИЕ.txt       — как восстановить сайт из бэкапа
#   checksums.txt            — контрольные суммы файлов (проверить, что бэкап не повреждён)
# Пароли, токены и данные пользователей кабинета сюда НЕ попадают — см. ПЕРЕДАЧА_ПРОЕКТА.md, раздел «Supabase».
param(
  [string]$Out = ''
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$repo = Split-Path -Parent $PSScriptRoot                 # ...\github\cpa-site
$project = Split-Path -Parent (Split-Path -Parent $repo) # ...\Проект сайта
if (-not $Out) { $Out = Join-Path $project 'backups' }
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmm'
$dest = Join-Path $Out "backup_$stamp"
New-Item -ItemType Directory -Force $dest | Out-Null

# git: обычный или тот, что идёт с GitHub Desktop
function Find-Git {
  $c = Get-Command git -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  $gd = Join-Path $env:LOCALAPPDATA 'GitHubDesktop'
  if (Test-Path $gd) {
    $f = Get-ChildItem $gd -Recurse -Filter git.exe -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match '\\cmd\\git\.exe$' } | Sort-Object FullName -Descending | Select-Object -First 1
    if ($f) { return $f.FullName }
  }
  return $null
}

# zip с русскими именами файлов (UTF-8) и путями через «/» — открывается и в Windows, и на Mac/Linux
# (в том числе когда архив загружают ИИ-помощнику). Папки из $skip (только верхнего уровня) не берём.
function Zip-Folder([string]$src, [string]$zip, [string[]]$skip) {
  $src = (Resolve-Path $src).Path.TrimEnd('\')
  $fs = [IO.File]::Open($zip, [IO.FileMode]::CreateNew)
  $arc = New-Object IO.Compression.ZipArchive($fs, [IO.Compression.ZipArchiveMode]::Create, $false, [Text.Encoding]::UTF8)
  try {
    Get-ChildItem $src -Force | Where-Object { $skip -notcontains $_.Name } | ForEach-Object {
      $items = if ($_.PSIsContainer) { Get-ChildItem $_.FullName -Recurse -File -Force } else { @($_) }
      foreach ($f in $items) {
        $rel = $f.FullName.Substring($src.Length + 1).Replace('\', '/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($arc, $f.FullName, $rel, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
      }
    }
  } finally {
    $arc.Dispose(); $fs.Dispose()
  }
}

Write-Host "Бэкап в: $dest"

# 1. Вся история репозитория
$git = Find-Git
$head = ''
if ($git) {
  $dirty = & $git -C $repo status --porcelain
  if ($dirty) { Write-Warning 'Есть несохранённые (незакоммиченные) изменения: в site-history.bundle их нет, но они есть в site-files.zip.' }
  # git пишет ход работы в поток ошибок — на время вызова не считаем это ошибкой
  $ErrorActionPreference = 'Continue'
  & $git -C $repo bundle create (Join-Path $dest 'site-history.bundle') --all 2>$null
  $code = $LASTEXITCODE
  $ErrorActionPreference = 'Stop'
  if ($code -ne 0) { throw 'Не удалось создать site-history.bundle' }
  $head = (& $git -C $repo log -1 --format='%h %s (%ci)') -join ''
  Write-Host '  ✓ site-history.bundle — вся история правок'
} else {
  Write-Warning 'git не найден (нет ни git, ни GitHub Desktop): история правок не сохранена, только файлы.'
}

# 2. Файлы сайта
Zip-Folder $repo (Join-Path $dest 'site-files.zip') @('.git')
Write-Host '  ✓ site-files.zip — файлы сайта'

# 3. Макеты и исходные материалы — всё из папки проекта, кроме самих бэкапов и копии репозитория (она уже выше)
Zip-Folder $project (Join-Path $dest 'design-and-sources.zip') @('backups', 'github')
Write-Host '  ✓ design-and-sources.zip — макеты и материалы'

# 4. Инструкция по восстановлению
$readme = @"
БЭКАП САЙТА «Африка. Путь к независимости» (Центр прикладной африканистики РГГУ)
Создан: $(Get-Date -Format 'dd.MM.yyyy HH:mm')
Последняя правка в истории: $head
Сайт: https://cpa-rggu.github.io/cpa-site/   Репозиторий: https://github.com/cpa-rggu/cpa-site

ЧТО ВНУТРИ
  site-history.bundle     — весь репозиторий со всей историей (git bundle)
  site-files.zip          — файлы сайта (то же, что в репозитории, без истории)
  design-and-sources.zip  — макеты (design-v2 и др.), исходные фото, задания для ИИ
  checksums.txt           — контрольные суммы SHA-256

ПОДРОБНОЕ ОПИСАНИЕ ПРОЕКТА — в site-files.zip, файл ПЕРЕДАЧА_ПРОЕКТА.md
(его можно целиком дать любому ИИ-помощнику: ChatGPT, Claude и др.).

КАК ВОССТАНОВИТЬ
1. Просто посмотреть сайт: распаковать site-files.zip, открыть папку и запустить
   powershell -ExecutionPolicy Bypass -File tools\serve.ps1  → http://localhost:8080/
2. Восстановить репозиторий со всей историей:
   git clone site-history.bundle cpa-site
3. Выложить заново на GitHub (если старый аккаунт/репозиторий потерян):
   а) создать новый пустой репозиторий на github.com (без README);
   б) в папке cpa-site:  git remote set-url origin https://github.com/ЛОГИН/РЕПОЗИТОРИЙ.git
                         git push -u origin main
   в) Settings → Pages → Deploy from a branch → main, папка / (root);
   г) в admin/config.yml поправить строку  repo: ЛОГИН/РЕПОЗИТОРИЙ  (или запустить tools\make-cms-config.ps1).
   Можно и без git: загрузить файлы из site-files.zip через GitHub Desktop.
4. Личный кабинет (Supabase): адрес проекта и публичный ключ — в content/auth.json.
   Список пользователей хранится в Supabase, а не здесь — см. ПЕРЕДАЧА_ПРОЕКТА.md.
"@
[IO.File]::WriteAllText((Join-Path $dest 'ВОССТАНОВЛЕНИЕ.txt'), $readme, (New-Object Text.UTF8Encoding($true)))

# 5. Контрольные суммы
$sums = Get-ChildItem $dest -File | Where-Object { $_.Name -ne 'checksums.txt' } | ForEach-Object {
  (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower() + '  ' + $_.Name
}
[IO.File]::WriteAllLines((Join-Path $dest 'checksums.txt'), $sums, (New-Object Text.UTF8Encoding($true)))

$mb = [math]::Round(((Get-ChildItem $dest -File | Measure-Object Length -Sum).Sum) / 1MB, 1)
Write-Host ''
Write-Host "Готово: $dest  ($mb МБ)"
Write-Host 'Скопируйте эту папку в облако (например, Облако Mail.ru) и на флешку или внешний диск.'
