# PRISM-SERVICE

**PRISM-SERVICE** является сервисом дисперсии данных блокчейна GOLOS, которые после вторичной обработки другими
 микросервисами могут быть использованы в [golos.io](https://golos.io) и приложениях.
 
API JSON-RPC:

 ```
 getNaturalFeed:             // Получение ленты постов в натуральном виде без ранжирования
     tags <string[]>([])     // Теги для фильтрации
     afterId <string>(null)  // ID после которого нужно начать показывать историю
     limit <number>(20)      // Необходимое количество постов
          
 getPopularFeed:             // Получение ленты постов с ранжированием "Популярное"
     tags <string[]>([])     // Теги для фильтрации
     afterId <string>(null)  // ID после которого нужно начать показывать историю
     limit <number>(20)      // Необходимое количество постов
      
 getActualFeed:              // Получение ленты постов с ранжированием "Актуальное"
     tags <string[]>([])     // Теги для фильтрации
     afterId <string>(null)  // ID после которого нужно начать показывать историю
     limit <number>(20)      // Необходимое количество постов
         
               
 getPromoFeed:               // Получение ленты постов с ранжированием "Промо"
     tags <string[]>([])     // Теги для фильтрации
     afterId <string>(null)  // ID после которого нужно начать показывать историю
     limit <number>(20)      // Необходимое количество постов  
         
                            
 getPersonalFeed:            // Получение ленты постов на основе подписок пользователя
     user <string>           // Имя пользователя
     tags <string[]>([])     // Теги для фильтрации
     afterId <string>(null)  // ID после которого нужно начать показывать историю
     limit <number>(20)      // Необходимое количество постов    
          
 ```

Возможные переменные окружения `ENV`:
  
 - `GLS_CONNECTOR_HOST` *(обязательно)* - адрес, который будет использован для входящих подключений связи микросервисов.  
  Дефолтное значение при запуске без докера - `127.0.0.1`

 - `GLS_CONNECTOR_PORT` *(обязательно)* - адрес порта, который будет использован для входящих подключений связи микросервисов.  
  Дефолтное значение при запуске без докера - `3000`

 - `GLS_METRICS_HOST` *(обязательно)* - адрес хоста для метрик StatsD.  
  Дефолтное значение при запуске без докера - `127.0.0.1`

 - `GLS_METRICS_PORT` *(обязательно)* - адрес порта для метрик StatsD.  
  Дефолтное значение при запуске без докера - `8125`

 - `GLS_MONGO_CONNECT` - строка подключения к базе MongoDB.  
  Дефолтное значение - `mongodb://mongo/admin`

 - `GLS_DAY_START` - время начала нового дня в часах относительно UTC.  
  Дефолтное значение - `3` (день начинается в 00:00 по Москве)
    
 - `GLS_MAX_FEED_LIMIT` - максимальное количество постов отдаваемое в ленту на 1 запрос за 1 раз.  
  Дефолтное значение - `100`
  
 - `GLS_CHAIN_PROPS_INTERVAL` - интервал актуализации динамических глобальных данных блокчейна.  
  Дефолтное значение - `60000`
  
 - `GLS_FEED_PRICE_INTERVAL` - интервал актуализации прайс-фида блокчейна.  
  Дефолтное значение - `60000`
  
 - `GLS_RAW_RESTORE_THREADS` - количество асинхронных потоков при загрузке блокчейна в режиме массового восстановления.  
  Дефолтное значение - `1000`
  
 - `GLS_RAW_RESTORE_END_VAL_SYNC_INTERVAL` - интервал актуализации последнего необходимого блока.  
  Дефолтное значение - `60000`
  
 - `GLS_DELEGATION_ROUND_LENGTH` - количество раундов подписи блока в блокчейне.  
  Дефолтное значение - `21`
  
 - `GLS_REVERT_TRACE_CLEANER_INTERVAL` - интервал запуска клинера неактуальных записей восстановления в случае форков.  
  Дефолтное значение - `300000`
  
 - `GLS_PAYOUT_FINALIZER_INTERVAL` - интервал актуализации финальных выплат для получившего выплаты контента.  
  Дефолтное значение - `310000`
  
 - `GLS_PAYOUT_RANGE` - время после которго происходит выплата за контент (авторские/кураторские/бенефициарские награды).  
  Дефолтное значение - `604800000`
 
Для запуска сервиса достаточно вызвать команду `docker-compose up --build` в корне проекта, предварительно указав
необходимые `ENV` переменные.  
