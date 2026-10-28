import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,r as a}from"./transactionItemsStep-re3qeqfb.js";import{n as o,t as s}from"./TransactionItemAmountDrawer-DyYqjEFT.js";var c,l,u,d,f,p,m;t((()=>{c=r(),l=e(n()),i(),o(),u={title:`Organisms/Transactions/TransactionItemAmountDrawer`,component:s,args:{open:!0,title:`餐饮 · 午餐`,categoryId:`lunch`,currency:`JPY`,value:``,quickAmounts:a.suggestions?.quickAmounts,onChange:()=>{},onConfirm:()=>{},onClose:()=>{}},render:function(e){let[t,n]=(0,l.useState)(e.value);return(0,c.jsx)(s,{...e,value:t,onChange:n})}},d={name:`上次与常用金额`},f={name:`没有对应快捷金额`,args:{quickAmounts:[]}},p={name:`人民币小数精度`,args:{currency:`CNY`}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "上次与常用金额"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "没有对应快捷金额",
  args: {
    quickAmounts: []
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "人民币小数精度",
  args: {
    currency: "CNY"
  }
}`,...p.parameters?.docs?.source}}},m=[`QuickAmounts`,`NoQuickAmounts`,`Cny`]}))();export{p as Cny,f as NoQuickAmounts,d as QuickAmounts,m as __namedExportsOrder,u as default};