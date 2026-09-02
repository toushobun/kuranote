import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,r as n}from"./merchants-RfyI_T8F.js";import{n as r,t as i}from"./MerchantEditForm-CzfeSCwz.js";var a,o,s,c;e((()=>{n(),r(),a={title:`Organisms/Merchants/MerchantEditForm`,component:i,args:{action:async()=>{},fetchIconAction:async()=>({}),ledgerId:`ledger-1`,merchant:t({note:`常去的超市`})}},o={name:`编辑商家（含所有字段）`},s={name:`编辑商家（仅必填项）`,args:{ledgerId:`ledger-1`,merchant:t({id:`00000000-0000-4000-8000-000000001002`,name:`Amazon`,note:null,sort_order:2,website_url:null})}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "编辑商家（含所有字段）"
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "编辑商家（仅必填项）",
  args: {
    ledgerId: "ledger-1",
    merchant: createMerchantRow({
      id: "00000000-0000-4000-8000-000000001002",
      name: "Amazon",
      note: null,
      sort_order: 2,
      website_url: null
    })
  }
}`,...s.parameters?.docs?.source}}},c=[`Default`,`WithoutOptionalFields`]}))();export{o as Default,s as WithoutOptionalFields,c as __namedExportsOrder,a as default};