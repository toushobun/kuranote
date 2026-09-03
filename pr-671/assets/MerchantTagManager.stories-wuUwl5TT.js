import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./MerchantTagManager-BFvTH64o.js";var r,i,a,o;e((()=>{t(),r={title:`Organisms/Merchants/MerchantTagManager`,component:n,args:{canManage:!0,keyword:``,selectedTagId:null,tags:[{icon:`🛒`,id:`tag-1`,merchant_count:6,name:`超市`,sort_order:0},{icon:`🍽️`,id:`tag-2`,merchant_count:4,name:`餐饮`,sort_order:1},{icon:`📦`,id:`tag-3`,merchant_count:2,name:`电商`,sort_order:2}]}},i={args:r.args,name:`商家标签筛选`},a={args:{...r.args,selectedTagId:`tag-1`},name:`选中标签`},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: meta.args,
  name: "商家标签筛选"
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    ...meta.args,
    selectedTagId: "tag-1"
  },
  name: "选中标签"
}`,...a.parameters?.docs?.source}}},o=[`Default`,`Selected`]}))();export{i as Default,a as Selected,o as __namedExportsOrder,r as default};