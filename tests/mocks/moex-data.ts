/**
 * Мок-данные в формате ответов MOEX API.
 *
 * Данные вырезаны из реальных ответов, с минимальным набором
 * записей для покрытия всех сценариев парсинга.
 */

export const MOEX_MOCK_CURRENCIES = JSON.stringify({
  securities: {
    columns: ['SECID', 'SECNAME', 'FACEVALUE', 'PREVPRICE'],
    data: [
      ['BYNRUB_TOM', 'BYN/RUB_TOM - BYN/РУБ', 1, null],
      ['CNYRUB_TOM', 'CNY/RUB_TOM - CNY/РУБ', 1, null],
      ['GLDRUB_TOM', 'GLD/RUB_TOM - GLD/РУБ', 1, null],
      ['KZTRUB_TOM', 'KZT/RUB_TOM - KZT/РУБ', 100, null],
      ['SLVRUB_TOM', 'SLV/RUB_TOM - SLV/РУБ', 1, null],
      ['TRYRUB_TOM', 'TRY/RUB_TOM - TRY/РУБ', 1, null],
      ['USD000UTSTOM', 'USDRUB_TOM - USD/РУБ', 1, null],
      // PREVPRICE fallback: WAPRICE=null, uses PREVPRICE=50
      ['PREVFALLRUB_TOM', 'WAPNULL/RUB_TOM', 1, 50],
      // FACEVALUE=0 protection: treated as 1, price=42
      ['FACEZERORUB_TOM', 'FACEZ/RUB_TOM', 0, null],
    ],
  },
  marketdata: {
    columns: ['SECID', 'WAPRICE'],
    data: [
      ['BYNRUB_TOM', 25.9567],
      ['CNYRUB_TOM', 10.5508],
      ['GLDRUB_TOM', 10345.06],
      ['KZTRUB_TOM', 15.7556],
      ['SLVRUB_TOM', 175.36],
      ['TRYRUB_TOM', 1.5999],
      ['USD000UTSTOM', 71.8605],
      ['PREVFALLRUB_TOM', null],
      ['FACEZERORUB_TOM', 42],
    ],
  },
})

export const MOEX_MOCK_INDEXES = JSON.stringify({
  securities: {
    columns: ['SECID', 'BOARDID', 'CURRENCYID', 'NAME'],
    data: [
      ['BCSGA', 'INAV', 'RUB', 'Расчетная цена одного пая Биржевого ПИФа РФИ «БКС Золото»'],
      ['OPNEO', 'INAV', 'EUR', 'Расчетная цена одного пая Биржевого ПИФа РФИ «Открытие – Акции Европы»'],
      ['AKEUBI', 'RTSI', 'USD', 'Индекс «Альфа- Капитал Управляемые еврооблигации»'],
      ['MOEXBTC', 'RTSI', 'USD', 'Индекс МосБиржи Биткоина'],
      ['RTSI', 'RTSI', 'USD', 'Индекс РТС'],
      ['RUCNYCP', 'RTSI', 'CNY', 'Индекс МосБиржи облигаций в CNY RUCNYCP'],
      ['IMOEX', 'SNDX', 'RUB', 'Индекс МосБиржи'],
      // Коллизия: один SECID на разных бордах
      ['BCSGA', 'SNDX', 'RUB', 'БКС Золото (дубликат на SNDX)'],
    ],
  },
  marketdata: {
    columns: ['SECID', 'CURRENTVALUE'],
    data: [
      ['BCSGA', 12.1876],
      ['OPNEO', 0.937],
      ['AKEUBI', 68.09],
      ['MOEXBTC', 77217.59],
      ['RTSI', 1140.61],
      ['RUCNYCP', 96.45],
      ['IMOEX', 2590.48],
      ['BCSGA', 12.35],
    ],
  },
})

export const MOEX_MOCK_SHARES = JSON.stringify({
  securities: {
    columns: ['SECID', 'BOARDID', 'SECNAME'],
    data: [
      ['ENPG', 'TQBR', 'МКПАО ЭН+ ГРУП ао'],
      ['SBER', 'TQBR', 'Сбербанк ПАО ао'],
      ['SBER', 'TQTF', 'БПИФ Сбербанк'],
      ['SILA', 'TQTF', 'БПИФ Сила Ликвидности'],
      ['AKMC', 'TQTF', 'БПИФ Альфа Денежный рынок'],
      ['AKMC', 'TQTY', 'БПИФ Альфа Денежный рынок Юани'],
      ['FALLBACK_OK', 'TQBR', 'Тестовая акция (WAPRICE=0, MARKETPRICE=500)'],
      ['FALLBACK_NULL', 'TQBR', 'Тестовая акция (WAPRICE=null, MARKETPRICE=600)'],
      ['MISSING_BOTH', 'TQBR', 'Тестовая акция (обе цены отсутствуют)'],
    ],
  },
  marketdata: {
    columns: ['SECID', 'BOARDID', 'WAPRICE', 'MARKETPRICE'],
    data: [
      ['ENPG', 'TQBR', 378.5, null],
      ['SBER', 'TQBR', 285.1, 284.9],
      ['SBER', 'TQTF', 290.5, 290.1],
      ['SILA', 'TQTF', 108.03, null],
      ['AKMC', 'TQTF', 14.12, null],
      ['AKMC', 'TQTY', 105.54, null],
      // WAPRICE=0 → фоллбек на MARKETPRICE
      ['FALLBACK_OK', 'TQBR', 0, 500.0],
      // WAPRICE=null → фоллбек на MARKETPRICE
      ['FALLBACK_NULL', 'TQBR', null, 600.0],
      // Оба поля отсутствуют/нулевые → акция пропускается
      ['MISSING_BOTH', 'TQBR', 0, 0],
    ],
  },
})
