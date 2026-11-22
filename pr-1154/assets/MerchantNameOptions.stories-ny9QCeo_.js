import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n,t as r}from"./merchants-RfyI_T8F.js";import{n as i,t as a}from"./MerchantNameOptions-gtJsSQy9.js";var o,s,c,l,u,d;e((()=>{n(),i(),o=t({aliases:[r({is_preferred:!0}),r({alias:`LIFE`,id:`alias-2`})],display_name:`来福`}),s={title:`Organisms/Merchants/MerchantNameOptions`,component:a,args:{merchant:o,setPreferredAliasAction:async()=>{}}},c={name:`列表页名称选项`},l={name:`正式名为当前显示名`,args:{merchant:{...o,aliases:o.aliases.map(e=>({...e,is_preferred:!1})),display_name:o.name}}},u={name:`切换处理中`,args:{pending:!0}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "列表页名称选项"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "正式名为当前显示名",
  args: {
    merchant: {
      ...merchant,
      aliases: merchant.aliases.map(alias => ({
        ...alias,
        is_preferred: false
      })),
      display_name: merchant.name
    }
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "切换处理中",
  args: {
    pending: true
  }
}`,...u.parameters?.docs?.source}}},d=[`Chips`,`FormalNameSelected`,`Pending`]}))();export{c as Chips,l as FormalNameSelected,u as Pending,d as __namedExportsOrder,s as default};