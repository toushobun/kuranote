import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n}from"./transactionStepFlow-jHa4zbU7.js";import{n as r,t as i}from"./ReceiptMerchantDrawer-Bz3qBMTW.js";var a,o,s,c;e((()=>{n(),r(),a={title:`Organisms/Transactions/ReceiptMerchantDrawer`,component:i,args:{picker:{open:!0,suspended:!1,openPicker:()=>{},closePicker:()=>{},selectMerchant:()=>{},onAddMerchant:void 0},merchants:t.merchants,merchantTags:t.merchantTags,frequentMerchants:t.frequentMerchants}},o={name:`选择商家`},s={name:`有新增商家权限`,args:{picker:{...a.args.picker,onAddMerchant:()=>{}}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "选择商家"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "有新增商家权限",
  args: {
    picker: {
      ...meta.args.picker,
      onAddMerchant: () => {}
    }
  }
}`,...s.parameters?.docs?.source}}},c=[`Default`,`WithCreation`]}))();export{o as Default,s as WithCreation,c as __namedExportsOrder,a as default};