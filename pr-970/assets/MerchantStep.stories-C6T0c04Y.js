import{i as e}from"./preload-helper-D2yxXLVK.js";import{i as t,r as n}from"./transactionStepFlow-8icpKE4Y.js";import{n as r,t as i}from"./MerchantStep-CiEE1Gji.js";var a,o,s,c,l,u,d,f,p,m;e((()=>{n(),r(),{userEvent:a,within:o}=__STORYBOOK_MODULE_TEST__,s={title:`Organisms/Transactions/MerchantStep`,component:i,args:t},c={name:`商家默认（常用不足八个）`},l={name:`读取建议中（被点中的商家显示加载）`,args:{loadingMerchantId:`seven`}},u={name:`没有商家`,args:{merchants:[],frequentMerchants:[]}},d={name:`商家分类筛选`,play:async({canvasElement:e})=>{await a.click(o(e.ownerDocument.body).getByRole(`button`,{name:`🍴 餐饮`}))}},f={name:`商家搜索`,play:async({canvasElement:e})=>{await a.type(o(e.ownerDocument.body).getByRole(`textbox`,{name:`搜索商家`}),`LIFE`)}},p={name:`搜索不到商家`,play:async({canvasElement:e})=>{await a.type(o(e.ownerDocument.body).getByRole(`textbox`,{name:`搜索商家`}),`星野咖啡`)}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "商家默认（常用不足八个）"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "读取建议中（被点中的商家显示加载）",
  args: {
    loadingMerchantId: "seven"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "没有商家",
  args: {
    merchants: [],
    frequentMerchants: []
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "商家分类筛选",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", {
      name: "🍴 餐饮"
    }));
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "商家搜索",
  play: async ({
    canvasElement
  }) => {
    await userEvent.type(within(canvasElement.ownerDocument.body).getByRole("textbox", {
      name: "搜索商家"
    }), "LIFE");
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "搜索不到商家",
  play: async ({
    canvasElement
  }) => {
    await userEvent.type(within(canvasElement.ownerDocument.body).getByRole("textbox", {
      name: "搜索商家"
    }), "星野咖啡");
  }
}`,...p.parameters?.docs?.source}}},m=[`MerchantDefault`,`LoadingMerchant`,`EmptyMerchants`,`FilteredMerchants`,`MerchantSearch`,`NoSearchResults`]}))();export{u as EmptyMerchants,d as FilteredMerchants,l as LoadingMerchant,c as MerchantDefault,f as MerchantSearch,p as NoSearchResults,m as __namedExportsOrder,s as default};