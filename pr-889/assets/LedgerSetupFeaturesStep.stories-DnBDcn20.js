import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n}from"./ledgerSetup-FkC1q1tT.js";import{a as r,i,o as a,s as o}from"./LedgerSetupAbandonButton-B-6_6lh3.js";import{r as s,t as c}from"./LedgerSetupWizard-COlBJMbU.js";function l(e){return t({draft:{...t().setup.draft,features:{specialStatusEnabled:e}},step:4})}var u,d,f,p,m;e((()=>{s(),r(),n(),u=l(!1),d={title:`Organisms/Ledgers/LedgerSetupFeaturesStep`,component:c,decorators:o,args:{actions:i(u),...a,progress:u},parameters:{viewport:{defaultViewport:`mobile2`}}},f={name:`默认（未开启）`},p={name:`已开启`,args:{progress:l(!0)}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "默认（未开启）"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "已开启",
  args: {
    progress: createFeaturesProgress(true)
  }
}`,...p.parameters?.docs?.source}}},m=[`Default`,`Enabled`]}))();export{f as Default,p as Enabled,m as __namedExportsOrder,d as default};