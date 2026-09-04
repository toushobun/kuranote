import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-7Nxww01z.js";import{n as i,t as a}from"./TransactionSearch-CeDyoVmL.js";function o({amount:e,idSuffix:t,merchantName:n,note:r,recorderName:i}){let a=`2026-07-01T10:00:00.000Z`;return{account_currency:`JPY`,account_name:`三井住友银行`,amount:e,categoryItems:[{amount:e,categoryName:`午餐`,categoryType:`expense`,parentCategoryName:`饮食`}],created_at:a,id:`00000000-0000-4000-8000-${t.padStart(12,`0`)}`,merchant_icon_url:null,merchant_name:n,note:r,recorder_name:i,transaction_at:a,type:`expense`}}var s,c,l,u,d,f,p,m,h,g,_;e((()=>{s=t(),n(),i(),c=[o({amount:`980`,idSuffix:`970001`,merchantName:`便利店`,note:`午餐和饮料`,recorderName:`我`}),o({amount:`1280`,idSuffix:`970002`,merchantName:`咖啡店`,note:`周末咖啡`,recorderName:`妻`})],l=o({amount:`8754`,idSuffix:`970003`,merchantName:`超级长名字的星巴克海洋馆旁边分店测试是否正常省略`,note:`这是一条比较长的备注，用来确认搜索结果列表在长文本场景下仍然保持移动端布局稳定。`,recorderName:`家庭成员名字也很长`}),u={title:`Templates/Transactions/TransactionSearchTemplate`,component:a,decorators:[e=>(0,s.jsx)(r,{storageScope:`storybook-transaction-search`,children:(0,s.jsx)(e,{})})],args:{errorMessage:null,initialPage:{items:c,nextOffset:null,totalCount:c.length},initialQuery:`便利店`,isLoading:!1}},d={name:`搜索结果`},f={name:`未输入关键词`,args:{initialPage:{items:[],nextOffset:null,totalCount:0},initialQuery:``}},p={name:`无搜索结果`,args:{initialPage:{items:[],nextOffset:null,totalCount:0},initialQuery:`不存在的商家`}},m={name:`加载中`,args:{isLoading:!0}},h={name:`搜索读取失败`,args:{errorMessage:`搜索结果读取失败，请稍后重新读取。`}},g={name:`长关键词和长商家名`,args:{initialPage:{items:[l],nextOffset:null,totalCount:1},initialQuery:`超级长名字的星巴克海洋馆旁边分店 8754 家庭成员名字也很长`}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "搜索结果"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "未输入关键词",
  args: {
    initialPage: {
      items: [],
      nextOffset: null,
      totalCount: 0
    },
    initialQuery: ""
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "无搜索结果",
  args: {
    initialPage: {
      items: [],
      nextOffset: null,
      totalCount: 0
    },
    initialQuery: "不存在的商家"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "加载中",
  args: {
    isLoading: true
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "搜索读取失败",
  args: {
    errorMessage: "搜索结果读取失败，请稍后重新读取。"
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "长关键词和长商家名",
  args: {
    initialPage: {
      items: [longTextItem],
      nextOffset: null,
      totalCount: 1
    },
    initialQuery: "超级长名字的星巴克海洋馆旁边分店 8754 家庭成员名字也很长"
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`EmptyKeyword`,`NoResults`,`Loading`,`WithError`,`LongKeywordAndMerchant`]}))();export{d as Default,f as EmptyKeyword,m as Loading,g as LongKeywordAndMerchant,p as NoResults,h as WithError,_ as __namedExportsOrder,u as default};