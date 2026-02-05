# Google Apps Script для Sales Suite Hub Waitlist

## Настройка

1. Откройте [Google Sheets](https://sheets.google.com) и создайте новую таблицу
2. Назовите её "Sales Suite Hub Waitlist"
3. Добавьте заголовки в первую строку: `Timestamp | Contact | Product | Source`
4. Откройте **Extensions → Apps Script**
5. Замените код на приведённый ниже
6. Нажмите **Deploy → New deployment → Web app**
7. Выберите "Anyone" для доступа
8. Скопируйте URL и вставьте его в `index.html` вместо `YOUR_GOOGLE_APPS_SCRIPT_URL`

## Код Apps Script

```javascript
const SHEET_NAME = 'Sheet1'; // Имя листа

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);
    
    // Добавляем новую строку
    sheet.appendRow([
      new Date().toISOString(),
      data.contact,
      data.product,
      data.source || 'web'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Sales Suite Hub Waitlist API is running');
}
```

## Структура данных

| Timestamp | Contact | Product | Source |
|-----------|---------|---------|--------|
| 2026-02-05T18:30:00Z | user@email.com | realtime_assistant | sales-suite-hub |
| 2026-02-05T18:35:00Z | @telegram_user | sales_analytics | sales-suite-hub |
