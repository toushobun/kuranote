import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n,t as r}from"./merchants-RfyI_T8F.js";import{n as i,t as a}from"./MerchantDisplayNameEditor-DKpccE3Z.js";var o,s,c,l;e((()=>{n(),i(),o={title:`Organisms/Merchants/MerchantDisplayNameEditor`,component:a,args:{archiveAliasAction:async()=>{},createAliasAction:async()=>{},merchant:t({aliases:[r({alias:`晨光生活`,is_preferred:!0}),r({alias:`晨光`,id:`alias-2`})],display_name:`晨光生活`,name:`晨光生活超市有限公司`}),setPreferredAliasAction:async()=>{}}},s={name:`显示名与别名管理`},c={name:`正式名为当前展示名`,args:{merchant:t({aliases:[],display_name:`晨光生活超市有限公司`,name:`晨光生活超市有限公司`})}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "显示名与别名管理"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "正式名为当前展示名",
  args: {
    merchant: createMerchantRow({
      aliases: [],
      display_name: "晨光生活超市有限公司",
      name: "晨光生活超市有限公司"
    })
  }
}`,...c.parameters?.docs?.source}}},l=[`Default`,`FormalNameSelected`]}))();export{s as Default,c as FormalNameSelected,l as __namedExportsOrder,o as default};