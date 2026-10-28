import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./TransactionSearch-PpGMsZiy.js";function r({amount:e,idSuffix:t,merchantName:n,note:r,recorderName:i}){let a=`2026-07-01T10:00:00.000Z`;return{account_currency:`JPY`,account_name:`三井住友银行`,amount:e,categoryItems:[{amount:e,categoryName:`午餐`,categoryType:`expense`,parentCategoryName:`饮食`}],created_at:a,id:`00000000-0000-4000-8000-${t.padStart(12,`0`)}`,merchant_icon_url:null,merchant_name:n,note:r,recorder_name:i,transaction_at:a,type:`expense`}}var i,a,o,s,c,l,u,d,f,p;e((()=>{t(),i=[r({amount:`980`,idSuffix:`970001`,merchantName:`便利店`,note:`午餐和饮料`,recorderName:`我`}),r({amount:`1280`,idSuffix:`970002`,merchantName:`咖啡店`,note:`周末咖啡`,recorderName:`妻`})],a=r({amount:`8754`,idSuffix:`970003`,merchantName:`超级长名字的星巴克海洋馆旁边分店测试是否正常省略`,note:`这是一条比较长的备注，用来确认搜索结果列表在长文本场景下仍然保持移动端布局稳定。`,recorderName:`家庭成员名字也很长`}),o={title:`Templates/Transactions/TransactionSearchTemplate`,component:n,args:{errorMessage:null,initialPage:{items:i,nextOffset:null,totalCount:i.length},initialQuery:`便利店`,isLoading:!1}},s={name:`搜索结果`},c={name:`未输入关键词`,args:{initialPage:{items:[],nextOffset:null,totalCount:0},initialQuery:``}},l={name:`无搜索结果`,args:{initialPage:{items:[],nextOffset:null,totalCount:0},initialQuery:`不存在的商家`}},u={name:`加载中`,args:{isLoading:!0}},d={name:`搜索读取失败`,args:{errorMessage:`搜索结果读取失败，请稍后重新读取。`}},f={name:`长关键词和长商家名`,args:{initialPage:{items:[a],nextOffset:null,totalCount:1},initialQuery:`超级长名字的星巴克海洋馆旁边分店 8754 家庭成员名字也很长`}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "搜索结果"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "未输入关键词",
  args: {
    initialPage: {
      items: [],
      nextOffset: null,
      totalCount: 0
    },
    initialQuery: ""
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "无搜索结果",
  args: {
    initialPage: {
      items: [],
      nextOffset: null,
      totalCount: 0
    },
    initialQuery: "不存在的商家"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "加载中",
  args: {
    isLoading: true
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "搜索读取失败",
  args: {
    errorMessage: "搜索结果读取失败，请稍后重新读取。"
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "长关键词和长商家名",
  args: {
    initialPage: {
      items: [longTextItem],
      nextOffset: null,
      totalCount: 1
    },
    initialQuery: "超级长名字的星巴克海洋馆旁边分店 8754 家庭成员名字也很长"
  }
}`,...f.parameters?.docs?.source}}},p=[`Default`,`EmptyKeyword`,`NoResults`,`Loading`,`WithError`,`LongKeywordAndMerchant`]}))();export{s as Default,c as EmptyKeyword,u as Loading,f as LongKeywordAndMerchant,l as NoResults,d as WithError,p as __namedExportsOrder,o as default};