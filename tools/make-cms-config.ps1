# Собирает admin/config.yml (настройки админки Sveltia CMS) из описания ниже.
# Нужен, чтобы не писать вручную одно и то же поле «на 5 языках» сотни раз.
# Запуск (из папки site):  powershell -ExecutionPolicy Bypass -File tools\make-cms-config.ps1
# Перед запуском впишите свой логин и имя репозитория в $Repo.
param([string]$Repo = 'ВАШ-ЛОГИН-GITHUB/cpa-site')

$site = Split-Path -Parent $PSScriptRoot
# Если репозиторий уже вписан в admin/config.yml вручную — сохраняем его
$old = Join-Path $site 'admin\config.yml'
if ($Repo -like 'ВАШ-ЛОГИН*' -and (Test-Path $old)) {
  $m = Select-String -Path $old -Pattern '^\s*repo:\s*(\S+)' -Encoding UTF8 | Select-Object -First 1
  if ($m) { $Repo = $m.Matches[0].Groups[1].Value }
}
$out = New-Object System.Collections.Generic.List[string]
function W([string]$s) { $out.Add($s) }
function Q([string]$s) { "'" + $s.Replace("'", "''") + "'" }

$LANGS = @(('ru', 'Русский'), ('en', 'English'), ('fr', 'Français'), ('pt', 'Português'), ('sw', 'Kiswahili'))

# Поле на 5 языках: группа с подполями ru/en/fr/pt/sw. Обязателен только русский.
function Tr([int]$ind, [string]$name, [string]$label, [string]$widget = 'string', [string]$hint = '', [string[]]$only = $null) {
  $p = ' ' * $ind
  if (-not $only) { $only = $LANGS | % { $_[0] } }
  W "$p- name: $name"
  W "$p  label: $(Q $label)"
  if ($hint) { W "$p  hint: $(Q $hint)" }
  W "$p  widget: object"
  W "$p  fields:"
  foreach ($l in $LANGS) {
    if ($only -notcontains $l[0]) { continue }
    $req = if ($l[0] -eq 'ru') { 'true' } else { 'false' }
    W "$p    - { name: $($l[0]), label: $(Q $l[1]), widget: $widget, required: $req }"
  }
}
function F([int]$ind, [string]$name, [string]$label, [string]$widget, [string]$extra = '') {
  $p = ' ' * $ind
  $e = if ($extra) { ", $extra" } else { '' }
  W "$p- { name: $name, label: $(Q $label), widget: $widget$e }"
}

W '# ВНИМАНИЕ: файл создан скриптом tools/make-cms-config.ps1 — правьте скрипт и запускайте его заново.'
W '# Админка: Sveltia CMS (https://sveltiacms.app). Совместима с Decap CMS.'
W 'backend:'
W '  name: github'
W "  repo: $Repo"
W '  branch: main'
W '  commit_messages:'
W "    create: 'Админка: создано «{{slug}}»'"
W "    update: 'Админка: обновлено «{{slug}}»'"
W "    delete: 'Админка: удалено «{{slug}}»'"
W "    uploadMedia: 'Админка: загружен файл {{path}}'"
W "    deleteMedia: 'Админка: удалён файл {{path}}'"
W '# Все фото и PDF лежат в папке assets; в JSON путь записывается как assets/имя-файла'
W 'media_folder: assets'
W 'public_folder: assets'
W 'collections:'

# ---------- Хроника ----------
W '  - name: chronicle'
W "    label: 'Хроника'"
W "    description: 'Годы на главной: место, заголовок, текст и фотографии. Порядок в списке = порядок вкладок.'"
W '    format: json'
W '    editor: { preview: false }'
W '    files:'
W '      - name: chronicle'
W "        label: 'Хроника независимости'"
W '        file: content/chronicle.json'
W '        fields:'
W '          - name: items'
W "            label: 'Годы'"
W '            widget: list'
W "            summary: '{{fields.year}}'"
W "            label_singular: 'год'"
W '            fields:'
F 14 'year' 'Год' 'string'
Tr 14 'place' 'Место (подпись под годом)'
Tr 14 'title' 'Заголовок'
Tr 14 'text' 'Текст' 'text'
F 14 'story' 'Ссылка на сюжет' 'string' "required: false, hint: 'Пока пусто — на сайте будет «Сюжет готовится». Когда появится страница сюжета, впишите её адрес.'"
W '              - name: photos'
W "                label: 'Фотографии (первая — главная)'"
W '                widget: list'
W "                summary: '{{fields.src}}'"
W "                label_singular: 'фото'"
W '                fields:'
F 18 'src' 'Фото' 'image'
F 18 'color' 'Показывать в цвете (марки, медали)' 'boolean' 'default: false, required: false'
Tr 18 'caption' 'Подпись'

# ---------- Выставки ----------
function ExFields([int]$ind) {
  Tr $ind 'city' 'Город, страна'
  Tr $ind 'venue' 'Площадка'
  F $ind 'date' 'Даты' 'string' "hint: 'Например: 10.2026 — 12.2026. Пока даты не подтверждены — в квадратных скобках.'"
  F $ind 'photo' 'Фото' 'image'
  F $ind 'sample' 'Пометка «ПРИМЕР» (данные ещё не настоящие)' 'boolean' 'default: true, required: false'
  F $ind 'link' 'Ссылка на страницу выставки' 'string' "required: false, hint: 'Пока пусто — страница выставки появится на следующем этапе.'"
}
W '  - name: exhibitions'
W "    label: 'Выставки'"
W "    description: 'Баннер «Сейчас» и карточки прошедших выставок.'"
W '    format: json'
W '    editor: { preview: false }'
W '    files:'
W '      - name: exhibitions'
W "        label: 'Выставки'"
W '        file: content/exhibitions.json'
W '        fields:'
W '          - name: current'
W "            label: 'Сейчас (большой баннер)'"
W '            widget: object'
W '            fields:'
ExFields 14
W '          - name: past'
W "            label: 'Прошедшие выставки (новые — сверху)'"
W '            widget: list'
W "            summary: '{{fields.date}}'"
W "            label_singular: 'выставку'"
W '            fields:'
ExFields 14

# ---------- Публикации ----------
W '  - name: publications'
W "    label: 'Публикации'"
W "    description: 'Статьи учёных Центра. На главной показываются первые три с галочкой «На главной».'"
W '    format: json'
W '    editor: { preview: false }'
W '    files:'
W '      - name: publications'
W "        label: 'Публикации'"
W '        file: content/publications.json'
W '        fields:'
W '          - name: items'
W "            label: 'Статьи (новые — сверху)'"
W '            widget: list'
W "            summary: '{{fields.year}} · {{fields.id}}'"
W "            label_singular: 'статью'"
W '            fields:'
F 14 'id' 'Короткий код статьи (латиницей, без пробелов)' 'string' "hint: 'Например: somaliland. Нужен для будущей страницы публикаций.'"
F 14 'featured' 'На главной' 'boolean' 'default: true, required: false'
F 14 'year' 'Год' 'string'
F 14 'region' 'Регион' 'select' "options: [{ label: 'Западная Африка', value: west }, { label: 'Восточная Африка', value: east }]"
Tr 14 'author' 'Автор' 'string' 'Так, как подписывать на сайте: «Н.А. Медушевский» / «N.A. Medushevsky».' @('ru', 'en')
Tr 14 'title' 'Название статьи' 'string' 'Русское название и авторский английский вариант. Для FR/PT/SW сайт показывает английский.' @('ru', 'en')
Tr 14 'journal' 'Журнал' 'string' 'Без кавычек и номера: Клио / Clio.' @('ru', 'en')
F 14 'issue' 'Год и номер выпуска' 'string' "hint: 'Например: 2025, № 7'"
F 14 'pages' 'Страницы' 'string' 'required: false'
F 14 'doi' 'DOI' 'string' "required: false, hint: 'Только сам номер, например 10.24412/2070-9773-2025-7223-97-103'"
F 14 'pdf' 'PDF статьи' 'file' 'required: false'
F 14 'cyberleninka' 'Ссылка на КиберЛенинку' 'string' 'required: false'
Tr 14 'keywords' 'Ключевые слова (через точку с запятой)' 'text' '' @('ru', 'en')
Tr 14 'abstract' 'Аннотация' 'text' 'Авторская аннотация — не переписывать по смыслу.' @('ru', 'en')

# ---------- Обложка ----------
W '  - name: hero'
W "    label: 'Обложка (фото на орбитах)'"
W "    description: 'Фотографии, которые летают по орбитам на первом экране, и их подписи.'"
W '    format: json'
W '    editor: { preview: false }'
W '    files:'
W '      - name: orbits'
W "        label: 'Фото на обложке'"
W '        file: content/orbits.json'
W '        fields:'
W '          - name: orbit'
W "            label: 'Фото на орбитах (по кругу сменяют друг друга)'"
W '            widget: list'
W "            summary: '{{fields.src}}'"
W "            label_singular: 'фото'"
W '            fields:'
F 14 'src' 'Фото' 'image'
Tr 14 'caption' 'Подпись'
W '          - name: still'
W "            label: 'Неподвижная раскладка (для посетителей с отключённой анимацией), до 10 фото'"
W '            widget: list'
W "            summary: '{{fields.src}}'"
W "            label_singular: 'фото'"
W '            max: 10'
W '            fields:'
F 14 'src' 'Фото' 'image'
Tr 14 'caption' 'Подпись'

# ---------- Тексты сайта ----------
$UI = [ordered]@{
  header = @('Шапка и меню', [ordered]@{ org = 'Название Центра'; uni = 'Университет'; abbr = 'Сокращение'; navLabel = 'Подпись меню (для незрячих)'; navChron = 'Пункт меню «Хроника»'; navExh = 'Пункт меню «Выставки»'; navPub = 'Пункт меню «Публикации»'; navAbout = 'Пункт меню «О Центре»'; menu = 'Кнопка «Меню» (телефон)' })
  hero = @('Обложка', [ordered]@{ kicker = 'Надпись над заголовком'; h1a = 'Заголовок, строка 1'; h1b = 'Заголовок, строка 2'; desc = 'Описание|text'; btnChron = 'Кнопка «Смотреть хронику»'; numLabel = 'Подпись поля номера (для незрячих)'; numPh = 'Подсказка в поле номера'; numShort = 'Подсказка в поле номера (телефон)'; open = 'Кнопка «Открыть»'; qr = 'Строка про QR-код (телефон)' })
  chronicle = @('Хроника', [ordered]@{ tlA = 'Заголовок, строка 1'; tlB = 'Заголовок, строка 2'; tlHint = 'Пояснение (компьютер)|text'; swipe = 'Пояснение (телефон)'; yearsLabel = 'Подпись вкладок годов (для незрячих)'; photosLabel = 'Подпись миниатюр (для незрячих)'; cta = 'Ссылка «Открыть сюжет»'; soon = 'Надпись «Сюжет готовится»' })
  exhibitions = @('Выставки', [ordered]@{ exh = 'Заголовок'; exhHint = 'Пояснение|text'; now = 'Метка «Сейчас»'; more = '«Подробнее»'; sample = 'Метка «ПРИМЕР»'; report = '«Фотоотчёт»'; hostTitle = 'Карточка: заголовок «Ваш город?»'; hostText = 'Карточка: текст|text'; host = 'Кнопка «Провести выставку у себя»'; lPartners = 'Метка «Для партнёров»' })
  publications = @('Публикации', [ordered]@{ pubKicker = 'Надпись над заголовком'; pubH = 'Заголовок'; pubHint = 'Пояснение|text'; pubRead = 'Кнопка «Читать PDF»'; pubAll = 'Кнопка «Все публикации»'; pubAdd = 'Кнопка «Добавить статью»'; regionWest = 'Регион «Западная Африка»'; regionEast = 'Регион «Восточная Африка»' })
  about = @('О Центре и контакты', [ordered]@{ about = 'Заголовок'; aboutText = 'Текст о Центре|text'; lEmail = 'Метка «Почта»'; vEmail = 'Адрес почты (одинаковый во всех языках)'; lPhone = 'Метка «Телефон»'; vPhone = 'Телефон'; lAddr = 'Метка «Адрес»'; vAddr = 'Адрес' })
  footer = @('Подвал', [ordered]@{ copy = 'Копирайт'; credits = 'Строка об источниках фото (компьютер)|text'; creditsShort = 'Строка об источниках фото (телефон)'; creditsTitle = 'Заголовок списка «Источники фотографий»' })
  system = @('Служебные сообщения', [ordered]@{ soonNotice = 'Сообщение «Раздел появится на следующем этапе»|text' })
}
W '  - name: texts'
W "    label: 'Тексты сайта'"
W "    description: 'Надписи, кнопки, заголовки, контакты — на пяти языках. Квадратные скобки [...] — заглушки, их заполнит Центр.'"
W '    format: json'
W '    editor: { preview: false }'
W '    files:'
W '      - name: ui'
W "        label: 'Тексты интерфейса и контакты'"
W '        file: content/ui.json'
W '        fields:'
foreach ($g in $UI.Keys) {
  W "          - name: $g"
  W "            label: $(Q $UI[$g][0])"
  W '            widget: object'
  W '            collapsed: true'
  W '            fields:'
  $keys = $UI[$g][1]
  foreach ($k in $keys.Keys) {
    $parts = $keys[$k].Split('|')
    $w = if ($parts.Length -gt 1) { $parts[1] } else { 'string' }
    Tr 14 $k $parts[0] $w
  }
}

# ---------- Источники фото ----------
W '  - name: credits'
W "    label: 'Источники фото'"
W "    description: 'Автор и лицензия каждого фото (Wikimedia Commons и др.). Показываются в подвале сайта.'"
W '    format: json'
W '    editor: { preview: false }'
W '    files:'
W '      - name: credits'
W "        label: 'Источники фото'"
W '        file: content/credits.json'
W '        fields:'
W '          - name: items'
W "            label: 'Фото'"
W '            widget: list'
W "            summary: '{{fields.src}}'"
W "            label_singular: 'фото'"
W '            fields:'
F 14 'src' 'Фото' 'image'
Tr 14 'credit' 'Автор · источник · лицензия' 'string' 'Например: Paul Weinberg · CC BY-SA 3.0'

$path = Join-Path $site 'admin\config.yml'
[IO.File]::WriteAllText($path, ($out -join "`n") + "`n", (New-Object Text.UTF8Encoding($false)))
Write-Host "Готово: $path"
