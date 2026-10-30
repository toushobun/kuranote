import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./ConfirmDialogProvider-vFDZBSiP.js";import{a as i,b as a,c as o,i as s,l as c,s as l,u,v as d,y as f}from"./userProfileFixtures-CyNsihKp.js";import{a as p,r as m}from"./SettingsEntryList-DPG9N1a3.js";import{n as h,t as g}from"./ProfileAccountLinking-BfpDAZ2a.js";var _,v,y,b,x,S,C,w,T,E;e((()=>{_=t(),n(),p(),c(),h(),v={title:`Organisms/Settings/ProfileAccountLinking`,component:g,decorators:[e=>(0,_.jsx)(r,{children:(0,_.jsx)(m,{label:`账号安全`,children:(0,_.jsx)(e,{})})})],args:{googleIdentity:a,isLast:!0,linkAction:u,linkFeedback:null,unlinkAction:d}},y={name:`未绑定（点击绑定后等待跳转）`},b={name:`未绑定（无法连接 Google）`,args:{linkAction:s}},x={name:`已绑定（可解除绑定）`,args:{googleIdentity:f}},S={name:`已绑定（解除绑定失败）`,args:{googleIdentity:f,unlinkAction:i}},C={name:`已绑定（Google 是唯一登录身份，禁止解除）`,args:{googleIdentity:o}},w={name:`Google 授权回跳：绑定成功`,args:{googleIdentity:f,linkFeedback:{kind:`success`}}},T={name:`Google 授权回跳：该 Google 账号已被其他用户使用`,args:{linkFeedback:{kind:`failure`,message:l}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "未绑定（点击绑定后等待跳转）"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "未绑定（无法连接 Google）",
  args: {
    linkAction: failedLinkGoogleIdentityAction
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "已绑定（可解除绑定）",
  args: {
    googleIdentity: unlinkableGoogleIdentity
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "已绑定（解除绑定失败）",
  args: {
    googleIdentity: unlinkableGoogleIdentity,
    unlinkAction: failedUnlinkGoogleIdentityAction
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "已绑定（Google 是唯一登录身份，禁止解除）",
  args: {
    googleIdentity: googleOnlyIdentity
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "Google 授权回跳：绑定成功",
  args: {
    googleIdentity: unlinkableGoogleIdentity,
    linkFeedback: {
      kind: "success"
    }
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "Google 授权回跳：该 Google 账号已被其他用户使用",
  args: {
    linkFeedback: {
      kind: "failure",
      message: googleIdentityAlreadyExistsMessage
    }
  }
}`,...T.parameters?.docs?.source}}},E=[`Unlinked`,`LinkStartFailed`,`Linked`,`UnlinkFailed`,`GoogleOnly`,`LinkedFromCallback`,`IdentityAlreadyExists`]}))();export{C as GoogleOnly,T as IdentityAlreadyExists,b as LinkStartFailed,x as Linked,w as LinkedFromCallback,S as UnlinkFailed,y as Unlinked,E as __namedExportsOrder,v as default};