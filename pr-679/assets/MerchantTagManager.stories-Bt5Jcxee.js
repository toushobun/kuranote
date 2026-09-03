import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./MerchantTagManager-BJgt-Go8.js";var r,i,a,o,s,c,l;e((()=>{t(),r=async()=>({}),i=async()=>({}),a={title:`Organisms/Merchants/MerchantTagManager`,component:n,args:{canManage:!0,keyword:``,selectedTagId:null,tags:[{icon:`🛒`,id:`tag-1`,merchant_count:6,name:`超市`,sort_order:0},{icon:`🍽️`,id:`tag-2`,merchant_count:4,name:`餐饮`,sort_order:1},{icon:`📦`,id:`tag-3`,merchant_count:2,name:`电商`,sort_order:2}]}},o={args:a.args,name:`商家标签筛选`},s={args:{...a.args,selectedTagId:`tag-1`},name:`选中标签`},c={args:{archiveAction:r,createAction:r,mode:`management`,reorderAction:i,tags:a.args.tags,updateAction:r},name:`标签管理`},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: meta.args,
  name: "商家标签筛选"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    ...meta.args,
    selectedTagId: "tag-1"
  },
  name: "选中标签"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    archiveAction: storyTagAction,
    createAction: storyTagAction,
    mode: "management",
    reorderAction: storyReorderAction,
    tags: meta.args.tags,
    updateAction: storyTagAction
  },
  name: "标签管理"
}`,...c.parameters?.docs?.source}}},l=[`Default`,`Selected`,`Management`]}))();export{o as Default,c as Management,s as Selected,l as __namedExportsOrder,a as default};