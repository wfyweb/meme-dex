### 页面功能

1. 用户注册登陆
   - 注册： 邮箱， 钱包， tg登陆
   - 登陆：
2. 首页token列表  
   字段：   
   tokenName   
   时间   
   池子   
   市值   
   持币着数量  
   交易数（买/卖）（区间查询）  
   交易额（区间查询） 1m 5m 1h 6h 24h  
   价格  
   1m 涨跌幅  
   5m 涨跌幅  
   1h 涨跌幅  
   安全监测（Mint 丢弃/黑名单/烧池子/Top10持仓/老鼠仓百分比）  
   Dev 持仓

### 钱包登陆流程

1.前端从服务端获取 nonce，

2.前端生成要进行签名的 message，这个 message 里要包含上一步生成的 nonce

3.前端调用 signMessage(message) 方法把 message 传进去让用户签名

4.前端拿到签名后，把签名、message、钱包地址这三项提交给登录 API，后端先检查 message 里面 nonce 是否有效，nonce 检查通过后，后端调用 verifyMessage(message, signature) 方法检查此方法返回的地址是否和用户提供的一致，如果地址一致，则说明用户是此地址的持有者，此时就登录成功了，给前端返回鉴权 token

参考： [https://cloud.tencent.com/developer/article/1343350](https://cloud.tencent.com/developer/article/1343350)

    [https://baiyun.me/sign-in-with-ethereum](https://baiyun.me/sign-in-with-ethereum)

### 接口

邮箱注册

+ 发送验证 

接入点：/auth/sendEmailVerify

请求方式：POST

输入参数：

| **参数名字** | **参数说明**          | **是否必须** |
| -------- | ----------------- | -------- |
| email    | 邮箱，比如 xxxx@qq.com | 是        |

+ 邮箱注册   

接入点：/auth/register

请求方式：POST

输入参数：

| **参数名字**   | **参数说明**          | **是否必须** |
| ---------- | ----------------- | -------- |
| email      | 邮箱，比如 xxxx@qq.com | 是        |
| password   | 密码                | 是        |
| email_code | 邮箱验证码             | 是        |

+ 邮箱用户登陆 

接入点：/auth/login

请求方式：POST

输入参数：

| **参数名字** | **参数说明**          | **是否必须** |
| -------- | ----------------- | -------- |
| email    | 邮箱，比如 xxxx@qq.com | 是        |
| password | 密码                | 是        |

+ 钱包登陆
  
      获取noce接口：

接入点：/auth/loginNonce?address=xxx 

请求方式：GET

输入参数：

| **参数名字** | **参数说明** | **是否必须** |
| -------- | -------- | -------- |
| address  | 钱包地址     | 是        |

    验证签名：

接入点：/auth/verifyMessage

请求方式：POST

输入参数：

| **参数名字**  | **参数说明**                                           | **是否必须** | **举例** |
| --------- | -------------------------------------------------- | -------- | ------ |
| address   | 钱包地址                                               | 是        | eth    |
| message   | <font style="color:rgb(51, 51, 51);">要签名的消息</font> | 是        |        |
| signature | 签名：web3.eth.personal.sign 函数返回的签名内容                | 是        |        |

+ 代表列表

接入点：/token/rank/swaps

请求方式：POST

输入参数：

| **参数名字**         | **参数说明**                                                                                                                                             | **是否必须** | **举例** |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| orderby          | 排序的字段名称：open_timestamp：时间  liquidity：池子 marketcap：市值 holder_count 持有者 swaps 交易数 volume 成交额  price：价格  change1m: 1m涨跌幅 change5m: 5m涨跌幅 change1h:1h涨跌幅 | 否        |        |
| direction        | <font style="color:rgb(51, 51, 51);">asc升序 降序 desc </font>                                                                                           | 否        |        |
| min_created      | 时间区间，开始时间1h                                                                                                                                          | 否        |        |
| max_created      | 时间区间，结束时间，如果有开始时间，需大于开始时间                                                                                                                            | 否        |        |
| min_liquidity    | 池子区间，最小池子                                                                                                                                            | 否        |        |
| max_liquidity    | 池子区间，最小池子                                                                                                                                            | 否        |        |
| min_marketcap    | 市值区间                                                                                                                                                 | 否        |        |
| max_marketcap    | 市值区间                                                                                                                                                 | 否        |        |
| min_holder_count | 持有者区间，最小持有者                                                                                                                                          | 否        |        |
| max_holder_count | 持有者区间，最大持有者                                                                                                                                          | 否        |        |
| min_swaps        | 交易数区间                                                                                                                                                | 否        |        |
| max_swaps        | 交易数区间                                                                                                                                                | 否        |        |
| min_volume       | 成交额区间                                                                                                                                                | 否        |        |
| max_volume       | 成交额区间                                                                                                                                                | 否        |        |
| filters          | 安全监测,Dev 的合集    burn:烧池子  distribed: Top10  frozen: 黑名单  renounced： Mint丢弃 ，<br/>creator_hold:DEV 未清仓 creator_close:DEV 清仓 token_burnt：DEV 烧币        | 否        |        |
| min_insider_rate | 老鼠仓 区间                                                                                                                                               | 否        |        |
| max_insider_rate | 老鼠仓 区间                                                                                                                                               | 否        |        |

```typescript
// /token/rank/swaps
{
  orderby: '', // 排序的字段名称：open_timestamp：时间  liquidity：池子 marketcap：市值 holder_count 持有者 swaps 交易数 volume 成交额  price：价格  change1m: 1m涨跌幅 change5m: 5m涨跌幅 change1h:1h涨跌幅
  direction: '', // asc升序 降序 desc 
  // 时间区间
  min_created: 1h // 开始时间
  max_created: 2h // 结束时间
  // 池子区间
  min_liquidity: 1000 
  max_liquidity: 2000
  // 市值区间
  min_marketcap: 1000 
  max_marketcap: 2000 
  //持有者区间
   min_holder_count: 20 
   max_holder_count: 2000
   //交易数区间
   min_swaps: 100
   max_swaps: 1000
   //成交额区间
   min_volume: 100
   max_volume: 1000
  // 安全监测
   filters: ['burn'] // burn:烧池子  distribed: Top10  frozen: 黑名单  renounced： Mint丢弃 ， 全部： 传入所有值
   // Dev: 也使用filters字段
   filters: ['creator_hold' ] //  creator_hold:DEV 未清仓 creator_close:DEV 清仓 token_burnt：DEV 烧币
   // 老鼠仓 区间
   min_insider_rate: 0.1
   max_insider_rate: 0.
}
```

```typescript
{
 "code": 0,
    "msg": "success",
    "data": [
       {
                "id": 11,
                "chain": "sol",
                "address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
                "symbol": "Bonk",
                "logo": "https://s2.coinmarketcap.com/static/img/coins/64x64/23095.png",
                "price": 0.0000512253,
                "price_change_percent": 2.40946,
                "swaps": 138903,
                "volume": 43178000,
                "liquidity": 409620,
                "market_cap": 4748340000,
                "hot_level": 2,
                "pool_creation_timestamp": 1696430892,
                "holder_count": 371808,
                "twitter_username": "bonk_inu",
                "website": "https://www.bonkcoin.com/",
                "telegram": "https://t.me/Official_Bonk_Inu",
                "open_timestamp": 1696430892,
                "price_change_percent1m": 0.867398,
                "price_change_percent5m": 0.270989,
                "price_change_percent1h": 0.431616,
                "buys": 67088,
                "sells": 71815,
                "swaps_24h": 138903,
                "initial_liquidity": 0,
                "is_show_alert": false,
                "top_10_holder_rate": 0.186741,
                "renounced_mint": 1,
                "renounced_freeze_account": 1,
                "burn_ratio": "0.0009",
                "burn_status": "burn",
                "launchpad": null,
                "dev_token_burn_amount": null,
                "dev_token_burn_ratio": null,
                "dexscr_ad": 0,
                "dexscr_update_link": 0,
                "cto_flag": 0,
                "twitter_change_flag": 0,
                "creator_token_status": 'creator_close', //  creator_hold ：未清仓/持仓  creator_close 清仓  creator_buy 加仓  creator_add_liquidity:加池子
                "launchpad_status": 1,
                "rat_trader_amount_rate": 0,
                "bluechip_owner_percentage": 0.0314221318529994,
                "smart_degen_count": 21,
                "renowned_count": 69
            },
    ]
}
```

### 后端任务分工

#### 用户登陆

邮箱注册-佩奇

+ 发送验证
+ 邮箱注册
+ 邮箱登陆

钱包连接-Jack

+ 获取noce
+ 验证签名

TG登陆

+ 目前不了解TG登陆流程，打算后面有空在开发

#### 代币查询

  全部数据-Jack

  时间查询-佩奇  
  池子查询-佩奇  
  市值查 -佩奇  
  持币着数量查询-Jack  
  交易数查询-Jack  
  交易额查询-Jack  
  价格查询-Jack  
  1m 涨跌幅查询-Jack  
  5m 涨跌幅查询-Jack  
  1h 涨跌幅查询-Jack  
  安全监测-Jack

  DEV持仓-Jack
