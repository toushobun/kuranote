import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./AccountForm-CC8kVzyu.js";var r,i,a,o,s,c;e((()=>{t(),r=[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],i={component:n,title:`Organisms/Accounts/AccountForm`},a={name:`无持有人初始状态`,args:{createAccountAction:async()=>{},defaultCurrency:`JPY`,holderOptions:r}},o={name:`带取消按钮`,args:{createAccountAction:async()=>{},defaultCurrency:`CNY`,holderOptions:r,onCancel:()=>{}}},s={name:`无可选持有人`,args:{createAccountAction:async()=>{},defaultCurrency:`JPY`,holderOptions:[]}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "无持有人初始状态",
  args: {
    createAccountAction: async () => {},
    defaultCurrency: "JPY",
    holderOptions
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "带取消按钮",
  args: {
    createAccountAction: async () => {},
    defaultCurrency: "CNY",
    holderOptions,
    onCancel: () => {}
  }
}`,...o.parameters?.docs?.source}}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "无可选持有人",
  args: {
    createAccountAction: async () => {},
    defaultCurrency: "JPY",
    holderOptions: []
  }
}`,...s.parameters?.docs?.source}}},c=[`WithoutHolderInitialState`,`WithCancelButton`,`NoHolderOptions`]}))();export{s as NoHolderOptions,o as WithCancelButton,a as WithoutHolderInitialState,c as __namedExportsOrder,i as default};