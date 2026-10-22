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

# Поле на 5 языках: группа с подполями ru/en/fr/pt/sw. Все языки необязательные:
# если перевода нет, сайт покажет английский, затем русский вариант.
# $optional — сама группа тоже может быть пустой (например, пометка только для других языков)
function Tr([int]$ind, [string]$name, [string]$label, [string]$widget = 'string', [string]$hint = '', [string[]]$only = $null, [bool]$optional = $false) {
  $p = ' ' * $ind
  if (-not $only) { $only = $LANGS | % { $_[0] } }
  W "$p- name: $name"
  W "$p  label: $(Q $label)"
  if ($hint) { W "$p  hint: $(Q $hint)" }
  W "$p  widget: object"
  if ($optional) { W "$p  required: false" }
  W "$p  fields:"
  foreach ($l in $LANGS) {
    if ($only -notcontains $l[0]) { continue }
    W "$p    - { name: $($l[0]), label: $(Q $l[1]), widget: $widget, required: false }"
  }
}
function F([int]$ind, [string]$name, [string]$label, [string]$widget, [string]$extra = '') {
  $p = ' ' * $ind
  $e = if ($extra) { ", $extra" } else { '' }
  W "$p- { name: $name, label: $(Q $label), widget: $widget$e }"
}
# Список, каждый элемент которого — текст на 5 языках (абзацы, теги)
function TrList([int]$ind, [string]$name, [string]$label, [string]$single, [string]$widget = 'string') {
  $p = ' ' * $ind
  W "$p- name: $name"
  W "$p  label: $(Q $label)"
  W "$p  widget: list"
  W "$p  required: false"
  W "$p  summary: '{{fields.ru}}'"
  W "$p  label_singular: $(Q $single)"
  W "$p  field:"
  W "$p    name: text"
  W "$p    label: $(Q $single)"
  W "$p    widget: object"
  W "$p    fields:"
  foreach ($l in $LANGS) {
    W "$p      - { name: $($l[0]), label: $(Q $l[1]), widget: $widget, required: false }"
  }
}
# Начало вложенного списка / группы полей
function ListStart([int]$ind, [string]$name, [string]$label, [string]$summary, [string]$single) {
  $p = ' ' * $ind
  W "$p- name: $name"
  W "$p  label: $(Q $label)"
  W "$p  widget: list"
  W "$p  required: false"
  W "$p  summary: $(Q $summary)"
  W "$p  label_singular: $(Q $single)"
  W "$p  fields:"
}
function ObjStart([int]$ind, [string]$name, [string]$label) {
  $p = ' ' * $ind
  W "$p- name: $name"
  W "$p  label: $(Q $label)"
  W "$p  widget: object"
  W "$p  fields:"
}
# Начало раздела админки: один JSON-файл со списком items
function FileCollection([string]$name, [string]$label, [string]$desc, [string]$file, [string]$listLabel, [string]$summary, [string]$single) {
  W "  - name: $name"
  W "    label: $(Q $label)"
  W "    description: $(Q $desc)"
  W '    format: json'
  W '    editor: { preview: false }'
  W '    files:'
  W "      - name: $name"
  W "        label: $(Q $label)"
  W "        file: $file"
  W '        fields:'
  W '          - name: items'
  W "            label: $(Q $listLabel)"
  W '            widget: list'
  W "            summary: $(Q $summary)"
  W "            label_singular: $(Q $single)"
  W '            fields:'
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
F 14 'story' 'Ссылка на сюжет' 'string' "required: false, hint: 'Например: story.html?id=africa (код сюжета — из раздела «Сюжеты»). Пусто — на сайте будет «Сюжет готовится».'"
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
  $q = $ind + 4
  F $ind 'id' 'Короткий код выставки (латиницей)' 'string' "hint: 'Например: dar. Из него получается адрес страницы: exhibition.html?id=dar'"
  Tr $ind 'city' 'Город, страна'
  Tr $ind 'venue' 'Площадка'
  F $ind 'date' 'Даты' 'string' "hint: 'Например: 10.2026 — 12.2026. Пока даты не подтверждены — в квадратных скобках.'"
  F $ind 'photo' 'Главное фото' 'image'
  F $ind 'sample' 'Пометка «ПРИМЕР» (данные ещё не настоящие)' 'boolean' 'default: true, required: false'
  F $ind 'link' 'Другая ссылка вместо страницы выставки' 'string' "required: false, hint: 'Обычно пусто: карточка ведёт на страницу выставки на этом сайте.'"
  # подробности для страницы выставки (всё необязательно — пустые блоки на странице не показываются)
  Tr $ind 'address' 'Страница: адрес площадки'
  Tr $ind 'hours' 'Страница: часы работы'
  Tr $ind 'entry' 'Страница: вход (свободный, по билетам…)'
  Tr $ind 'body' 'Страница: текст о выставке на этой площадке' 'text'
  ListStart $ind 'stats' 'Страница: цифры (экспонатов, разделов…)' '{{fields.value}}' 'цифру'
  F $q 'value' 'Число' 'string'
  Tr $q 'label' 'Подпись'
  ListStart $ind 'sections' 'Страница: разделы-сюжеты' '{{fields.story}}' 'раздел'
  F $q 'story' 'Код сюжета' 'string' "hint: 'Из раздела «Сюжеты»: aswan, africa, tanganyika, sa'"
  F $q 'photo' 'Фото на карточке' 'image' 'required: false'
  F $q 'years' 'Годы' 'string'
  ListStart $ind 'gallery' 'Страница: фоторепортаж' '{{fields.src}}' 'фото'
  F $q 'src' 'Фото' 'image'
  Tr $q 'caption' 'Подпись'
  F $q 'credit' 'Автор и лицензия' 'string' 'required: false'
  ListStart $ind 'partners' 'Страница: партнёры' '{{fields.name.ru}}' 'партнёра'
  Tr $q 'name' 'Название'
  F $q 'logo' 'Логотип' 'image' 'required: false'
  ListStart $ind 'press' 'Страница: пресса' '{{fields.title.ru}}' 'публикацию'
  Tr $q 'source' 'Издание и дата'
  Tr $q 'title' 'Заголовок'
  F $q 'link' 'Ссылка' 'string' 'required: false'
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
F 14 'id' 'Короткий код статьи (латиницей, без пробелов)' 'string' "hint: 'Например: somaliland. Из него получается ссылка publications.html#pub-somaliland'"
F 14 'featured' 'На главной' 'boolean' 'default: true, required: false'
F 14 'authorId' 'Код автора' 'string' "hint: 'Из раздела «Авторы», например: medushevsky'"
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

# ---------- Авторы ----------
FileCollection 'authors' 'Авторы' 'Карточки учёных Центра на странице публикаций.' 'content/authors.json' 'Авторы' '{{fields.id}}' 'автора'
F 14 'id' 'Код автора (латиницей)' 'string' "hint: 'Например: medushevsky. Его же пишут в поле «Код автора» у статьи.'"
Tr 14 'initials' 'Инициалы в квадрате' 'string' '' @('ru', 'en')
Tr 14 'name' 'Полное имя' 'string' '' @('ru', 'en')
Tr 14 'cite' 'Имя для «Как цитировать»' 'string' 'Например: Медушевский Н.А. / Medushevsky N.A.' @('ru', 'en')
Tr 14 'role' 'Учёная степень, должность'
Tr 14 'affiliation' 'Место работы' 'string' '' @('ru', 'en')
F 14 'orcid' 'Ссылка ORCID' 'string' 'required: false'

# ---------- Сюжеты ----------
FileCollection 'stories' 'Сюжеты' 'Длинные страницы сюжетов: story.html?id=код. Порядок в списке = порядок в блоке «Другие сюжеты».' 'content/stories.json' 'Сюжеты' '{{fields.id}}' 'сюжет'
F 14 'id' 'Код сюжета (латиницей)' 'string' "hint: 'Например: africa → адрес story.html?id=africa'"
F 14 'card' 'Фото на карточке «Другие сюжеты»' 'image'
F 14 'minutes' 'Минут чтения' 'number' 'value_type: int, min: 1, default: 5'
ObjStart 14 'hero' 'Фото на обложке'
F 18 'src' 'Фото' 'image'
F 18 'position' 'Какую часть фото показывать' 'string' "required: false, hint: 'Например: center 40% (по горизонтали и вертикали)'"
F 18 'color' 'Почти в цвете (для марок)' 'boolean' 'default: false, required: false'
Tr 14 'heroCredit' 'Подпись к фото обложки (автор, лицензия)'
Tr 14 'meta' 'Короткая метка для карточки (СТРАНА · ГОДЫ)'
Tr 14 'kicker' 'Надпись над заголовком'
Tr 14 'title' 'Заголовок'
Tr 14 'heroAlt' 'Описание фото обложки (для незрячих)'
Tr 14 'lead' 'Подзаголовок' 'text'
ListStart 14 'passport' 'Паспорт сюжета' '{{fields.label.ru}}' 'строку'
Tr 18 'label' 'Название строки (СТРАНА, ПЕРИОД…)'
Tr 18 'value' 'Значение'
TrList 14 'tags' 'Темы' 'тему'
Tr 14 'intro' 'Вступление (крупным шрифтом)' 'text'
TrList 14 'before' 'Абзацы до фото' 'абзац' 'text'
ObjStart 14 'figure' 'Большое фото внутри текста'
F 18 'item' 'Номер материала из списка «Материалы» (с нуля)' 'number' 'value_type: int, min: 0, default: 0'
Tr 18 'caption' 'Подпись'
Tr 18 'credit' 'Автор и лицензия'
TrList 14 'after' 'Абзацы после фото' 'абзац' 'text'
Tr 14 'quote' 'Цитата' 'text'
Tr 14 'quoteBy' 'Автор цитаты и шифр документа'
Tr 14 'closing' 'Заключительный абзац' 'text'
ListStart 14 'steps' 'Хронология' '{{fields.year}}' 'событие'
F 18 'year' 'Год' 'string'
Tr 18 'date' 'Дата (ИЮЛЬ, 27 ДЕКАБРЯ…)'
Tr 18 'text' 'Что произошло' 'text'
ListStart 14 'items' 'Материалы сюжета' '{{fields.code}}' 'материал'
F 18 'type' 'Тип' 'select' "options: [{ label: 'Фото', value: photo }, { label: 'Документ', value: doc }, { label: 'Пресса', value: press }]"
F 18 'src' 'Файл (фото или скан)' 'image' "required: false, hint: 'Пусто — на сайте будет надпись «скан из архива Центра»'"
F 18 'code' 'Шифр' 'string' "required: false, hint: 'Например: CPA-EG-001. MODERN — современное фото.'"
F 18 'color' 'Показывать в цвете' 'boolean' 'default: false, required: false'
Tr 18 'title' 'Название'
Tr 18 'date' 'Дата'
Tr 18 'credit' 'Источник (автор, лицензия)'
ObjStart 14 'optics' 'Две оптики'
Tr 18 'intro' 'Пояснение' 'text'
ListStart 18 'columns' 'Колонки' '{{fields.label.ru}}' 'колонку'
Tr 22 'label' 'Заголовок (СОВЕТСКАЯ ПРЕССА…)'
Tr 22 'scan' 'Подпись к скану'
Tr 22 'text' 'Текст' 'text'

# ---------- Экспонаты ----------
FileCollection 'exhibits' 'Экспонаты (QR)' 'Страницы экспонатов: exhibit.html?n=номер. QR-код на стенде ведёт на такой адрес.' 'content/exhibits.json' 'Экспонаты' '{{fields.n}}' 'экспонат'
F 14 'n' 'Номер экспоната' 'string' "hint: 'Как на стенде, например 03.14'"
Tr 14 'kind' 'Тип (ФОТОГРАФИЯ, ПОЧТОВАЯ МАРКА…)'
Tr 14 'title' 'Название'
Tr 14 'place' 'Место'
Tr 14 'date' 'Дата'
Tr 14 'author' 'Автор'
Tr 14 'source' 'Источник и лицензия'
ListStart 14 'photos' 'Фото (листаются нажатием)' '{{fields.src}}' 'фото'
F 18 'src' 'Фото' 'image'
F 18 'color' 'Показывать в цвете' 'boolean' 'default: false, required: false'
ObjStart 14 'back' 'Ссылка «назад» вверху'
Tr 18 'label' 'Текст ссылки'
F 18 'href' 'Адрес' 'string' "hint: 'Например: story.html?id=aswan или index.html#timeline'"
F 14 'audio' 'Аудиогид (mp3)' 'file' "required: false, hint: 'Пока пусто — кнопка «Слушать историю» покажет «появится на следующем этапе».'"
Tr 14 'text' 'Описание' 'text'
Tr 14 'story' 'История из архива Центра' 'text'
ListStart 14 'optics' 'Две оптики' '{{fields.label.ru}}' 'вкладку'
Tr 18 'label' 'Вкладка (Советская пресса…)'
Tr 18 'scan' 'Подпись к скану'
Tr 18 'text' 'Текст' 'text'
W '              - name: related'
W "                label: 'Рядом на выставке (номера экспонатов)'"
W '                widget: list'
W '                required: false'
W '                field: { name: n, label: ''Номер'', widget: string }'

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
  header = @('Шапка и меню', [ordered]@{ org = 'Название Центра'; uni = 'Университет'; abbr = 'Сокращение'; navLabel = 'Подпись меню (для незрячих)'; navChron = 'Пункт меню «Хроника»'; navExh = 'Пункт меню «Выставки»'; navPub = 'Пункт меню «Публикации»'; navAbout = 'Пункт меню «О Центре»'; navArch = 'Пункт меню «Архив» (на странице сюжета)'; menu = 'Кнопка «Меню» (телефон)' })
  common = @('Общие надписи', [ordered]@{ home = '«Главная» (в навигации)'; toHome = '«На главную»'; breadcrumb = 'Подпись навигации «Путь» (для незрячих)' })
  hero = @('Обложка', [ordered]@{ kicker = 'Надпись над заголовком'; h1a = 'Заголовок, строка 1'; h1b = 'Заголовок, строка 2'; desc = 'Описание|text'; btnChron = 'Кнопка «Смотреть хронику»'; numLabel = 'Подпись поля номера (для незрячих)'; numPh = 'Подсказка в поле номера'; numShort = 'Подсказка в поле номера (телефон)'; open = 'Кнопка «Открыть»'; qr = 'Строка про QR-код (телефон)' })
  chronicle = @('Хроника', [ordered]@{ tlA = 'Заголовок, строка 1'; tlB = 'Заголовок, строка 2'; tlHint = 'Пояснение (компьютер)|text'; swipe = 'Пояснение (телефон)'; yearsLabel = 'Подпись вкладок годов (для незрячих)'; photosLabel = 'Подпись миниатюр (для незрячих)'; cta = 'Ссылка «Открыть сюжет»'; soon = 'Надпись «Сюжет готовится»' })
  exhibitions = @('Выставки', [ordered]@{ exh = 'Заголовок'; exhHint = 'Пояснение|text'; now = 'Метка «Сейчас»'; more = '«Подробнее»'; sample = 'Метка «ПРИМЕР»'; report = '«Фотоотчёт»'; hostTitle = 'Карточка: заголовок «Ваш город?»'; hostText = 'Карточка: текст|text'; host = 'Кнопка «Провести выставку у себя»'; lPartners = 'Метка «Для партнёров»' })
  publications = @('Публикации', [ordered]@{ pubKicker = 'Надпись над заголовком'; pubH = 'Заголовок'; pubHint = 'Пояснение|text'; pubRead = 'Кнопка «Читать PDF»'; pubAll = 'Кнопка «Все публикации»'; pubAdd = 'Кнопка «Добавить статью»'; regionWest = 'Регион «Западная Африка»'; regionEast = 'Регион «Восточная Африка»' })
  about = @('О Центре и контакты', [ordered]@{ about = 'Заголовок'; aboutText = 'Текст о Центре|text'; lDirector = 'Метка «Директор»'; vDirector = 'Директор (ФИО; пусто — строка не показывается)||opt'; lDoc = 'Метка «Положение»'; vDoc = 'Текст ссылки на положение'; docUrl = 'Адрес положения (ссылка на PDF; пусто — строка не показывается)||opt'; lEmail = 'Метка «Почта»'; vEmail = 'Адрес почты (одинаковый во всех языках)'; lPhone = 'Метка «Телефон»'; vPhone = 'Телефон'; lAddr = 'Метка «Адрес»'; vAddr = 'Адрес' })
  footer = @('Подвал', [ordered]@{ copy = 'Копирайт' })
  story = @('Страница сюжета', [ordered]@{ story = '«СЮЖЕТ» в навигации'; items = '«МАТЕРИАЛОВ»'; read = '«~{n} МИН ЧТЕНИЯ» ({n} — число)'; updated = '«ОБНОВЛЕНО [ДАТА]»'; passport = '«ПАСПОРТ СЮЖЕТА»'; topics = '«ТЕМЫ»'; seeMat = 'Кнопка «Смотреть материалы»'; download = 'Кнопка «Скачать для исследования»'; zoom = '«Открыть фото крупно» (для незрячих)'; timeline = 'Заголовок «Хронология»'; matTitle = 'Заголовок «Материалы сюжета»'; filterLabel = '«Тип материала» (для незрячих)'; fAll = 'Фильтр «Все»'; fPhoto = 'Фильтр «Фото»'; fDoc = 'Фильтр «Документы»'; fPress = 'Фильтр «Пресса»'; scan = '«[скан из архива Центра]»'; optics = 'Заголовок «Две оптики»'; other = 'Заголовок «Другие сюжеты»'; viewer = '«Просмотр материала» (для незрячих)'; close = '«Закрыть»'; prev = '«Предыдущий»'; next = '«Следующий»'; lbDate = '«ДАТА»'; lbCode = '«ШИФР»'; lbSrc = '«ИСТОЧНИК»'; kPhoto = 'Метка «ФОТО»'; kDoc = 'Метка «ДОКУМЕНТ»'; kPress = 'Метка «ПРЕССА»'; sample = '«[пример]» после шифра'; ref = '«[шифр]»'; modern = '«СОВРЕМЕННОЕ ФОТО»'; notFound = '«Сюжет не найден»' })
  exhibit = @('Страница экспоната (QR)', [ordered]@{ word = '«ЭКСПОНАТ»'; stamp = 'Штамп «АРХИВ ЦПА» на фото'; lPlace = '«МЕСТО»'; lDate = '«ДАТА»'; lAuthor = '«АВТОР»'; lSource = '«ИСТОЧНИК»'; listen = 'Кнопка «Слушать историю»'; optics = '«Две оптики» (для незрячих)'; opticsHead = '«ДВЕ ОПТИКИ · КАК ОБ ЭТОМ ПИСАЛИ»'; near = 'Заголовок «Рядом на выставке»'; navLabel = '«Экспонаты» (для незрячих)'; prev = '«НАЗАД»'; next = '«ДАЛЕЕ»'; notFound = 'Сообщение «Экспонат не найден»|text' })
  exhibition = @('Страница выставки', [ordered]@{ word = '«ВЫСТАВКА»'; now = '«СЕЙЧАС»'; lDates = '«ДАТЫ»'; lPlace = '«АДРЕС»'; lHours = '«ЧАСЫ»'; lEntry = '«ВХОД»'; aboutH = 'Заголовок «О выставке»'; lead = 'Общий текст о выставке|text'; sectH = 'Заголовок «Разделы выставки»'; sectHint = 'Пояснение к разделам|text'; hall = '«РАЗДЕЛ»'; open = '«Открыть сюжет»'; photoH = 'Заголовок «Фоторепортаж»'; prev = '«Предыдущее фото»'; next = '«Следующее фото»'; partnersH = 'Заголовок «Партнёры»'; pressH = 'Заголовок «Пресса»'; otherH = 'Заголовок «Другие выставки»'; notFound = '«Выставка не найдена»' })
  pubpage = @('Страница публикаций и форма', [ordered]@{ submitEmail = 'ПОЧТА ДЛЯ ЗАЯВОК (куда приходят письма из формы; пусто — почта Центра из «О Центре»)||opt'; h1 = 'Заголовок'; lead = 'Подзаголовок|text'; stPubs = '«публикации»'; stAuthors = '«автор»'; stJournals = '«журнала»'; filterLabel = '«Регион» (для незрячих)'; fAll = 'Фильтр «Все»'; pages = '«с.» (страницы)'; abs = 'Кнопка «Аннотация»'; absHide = 'Кнопка «Скрыть аннотацию»'; absHead = '«АННОТАЦИЯ»'; absNote = 'Пометка для FR/PT/SW «статья на русском…» (по-русски пусто)||opt'; pdf = 'Кнопка «PDF»'; cl = 'Кнопка «КиберЛенинка»'; cite = '«КАК ЦИТИРОВАТЬ»'; authorsHead = '«АВТОРЫ ЦЕНТРА»'; count1 = '«публикации» (в карточке автора)'; addTitle = 'Карточка «Вы учёный Центра?»'; addText = 'Текст карточки|text'; addCta = '«Добавить статью»'; upKicker = 'Форма: надпись над заголовком'; upTitle = 'Форма: заголовок'; upText = 'Форма: пояснение|text'; step1 = 'Шаг 1'; step2 = 'Шаг 2'; step3 = 'Шаг 3'; fAuthor = 'Поле «АВТОР»'; phAuthor = 'Подсказка в поле автора'; fYear = 'Поле «ГОД»'; fTitle = 'Поле «НАЗВАНИЕ»'; phTitle = 'Подсказка в поле названия'; fJournal = 'Поле «ЖУРНАЛ»'; phJournal = 'Подсказка в поле журнала'; fDoi = 'Поле «DOI»'; fAbs = 'Поле «АННОТАЦИЯ»'; phAbs = 'Подсказка в поле аннотации'; fLink = 'Поле «ССЫЛКА НА PDF»'; fAgree = 'Галочка «Статья в открытом доступе…»|text'; submit = 'Кнопка «Отправить на проверку»'; mailNote = 'Пояснение под кнопкой|text'; noEmail = 'Сообщение «Адрес для заявок не указан»|text'; needAgree = 'Сообщение «Заполните поля»|text'; sentMsg = 'Сообщение после отправки|text'; mailSubject = 'Тема письма'; credits = 'Строка в подвале' })
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
    # «Подпись|text|opt»: text — многострочное поле, opt — можно оставить пустым и по-русски
    $parts = $keys[$k].Split('|')
    $w = if ($parts.Length -gt 1 -and $parts[1]) { $parts[1] } else { 'string' }
    $opt = $parts -contains 'opt'
    Tr 14 $k $parts[0] $w '' $null $opt
  }
}

# Раздел «Источники фото» убран по решению владельца сайта (22.10.2026).
# Данные сохранены в content/credits.json — если понадобится вернуть, см. историю этого файла в Git.

$path = Join-Path $site 'admin\config.yml'
[IO.File]::WriteAllText($path, ($out -join "`n") + "`n", (New-Object Text.UTF8Encoding($false)))
Write-Host "Готово: $path"
