import{i as e}from"./preload-helper-D2yxXLVK.js";import{a as t,c as n,d as r,i,s as a,u as o}from"./LedgerSetupAbandonButton-CsxyY50K.js";import{n as s,t as c}from"./LedgerSetupWizard-C4KA4c4Z.js";function l(e){return o({draft:{...o().setup.draft,features:{multiAccountPaymentEnabled:e,specialStatusEnabled:e}},step:4})}var u,d,f,p,m;e((()=>{s(),t(),r(),u=l(!1),d={title:`Organisms/Ledgers/LedgerSetupFeaturesStep`,component:c,decorators:n,args:{actions:i(u),...a,progress:u},parameters:{viewport:{defaultViewport:`mobile2`}}},f={name:`默认（未开启）`},p={name:`已开启`,args:{progress:l(!0)}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "默认（未开启）"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "已开启",
  args: {
    progress: createFeaturesProgress(true)
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Enabled`]}))();export{f as Default,p as Enabled,m as __namedExportsOrder,d as default};