import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./GoogleAuthSection-DPhNYBcG.js";var r,i,a,o,s;e((()=>{t(),r={title:`Molecules/Auth/GoogleAuthSection`,component:n,args:{action:async()=>{}}},i={name:`默认`},a={name:`含 OAuth 错误提示`,args:{errorMessage:`Google 登录未完成，请重新尝试或改用邮箱方式。`}},o={name:`入口关闭后仅显示错误`,args:{action:void 0,errorMessage:`暂时无法连接 Google，请稍后重试或改用邮箱方式。`}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: "默认"
}`,...i.parameters?.docs?.source}}},a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "含 OAuth 错误提示",
  args: {
    errorMessage: "Google 登录未完成，请重新尝试或改用邮箱方式。"
  }
}`,...a.parameters?.docs?.source}}},o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "入口关闭后仅显示错误",
  args: {
    action: undefined,
    errorMessage: "暂时无法连接 Google，请稍后重试或改用邮箱方式。"
  }
}`,...o.parameters?.docs?.source}}},s=[`Default`,`WithError`,`ErrorOnly`]}))();export{i as Default,o as ErrorOnly,a as WithError,s as __namedExportsOrder,r as default};