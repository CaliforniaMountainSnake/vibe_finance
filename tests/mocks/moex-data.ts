/**
 * Мок-данные в формате ответов MOEX API.
 *
 * Данные вырезаны из реальных ответов, с минимальным набором
 * записей для покрытия всех сценариев парсинга.
 */

export const MOEX_MOCK_CURRENCIES = JSON.stringify({
  securities: {
    columns: ['SECID', 'SECNAME'],
    data: [
      ['BYNRUB_TOM', 'BYN/RUB_TOM - BYN/РУБ'],
      ['CNYRUB_TOM', 'CNY/RUB_TOM - CNY/РУБ'],
      ['GLDRUB_TOM', 'GLD/RUB_TOM - GLD/РУБ'],
      ['KZTRUB_TOM', 'KZT/RUB_TOM - KZT/РУБ'],
      ['SLVRUB_TOM', 'SLV/RUB_TOM - SLV/РУБ'],
      ['TRYRUB_TOM', 'TRY/RUB_TOM - TRY/РУБ'],
      ['USD000UTSTOM', 'USDRUB_TOM - USD/РУБ'],
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
    ],
  },
})

export const MOEX_MOCK_SHARES = JSON.stringify({
  securities: {
    columns: ['SECID', 'BOARDID', 'SECNAME'],
    data: [
      ['ENPG', 'TQBR', 'МКПАО ЭН+ ГРУП ао'],
      ['SBER', 'TQBR', 'Сбербанк ПАО ао'],
      ['SILA', 'TQTF', 'БПИФ Сила Ликвидности'],
      ['AKMC', 'TQTY', 'БПИФ Альфа Денежный рынок Юани'],
    ],
  },
  marketdata: {
    columns: ['SECID', 'BOARDID', 'WAPRICE'],
    data: [
      ['ENPG', 'TQBR', 378.5],
      ['SBER', 'TQBR', 285.1],
      ['SILA', 'TQTF', 108.03],
      ['AKMC', 'TQTY', 105.54],
    ],
  },
})
