import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-pqKi5BSI.js";import{n as i,t as a}from"./ConfirmDialogProvider-BAYap8m-.js";import{a as o,b as s,c,i as l,l as u,s as d,u as f,v as p,y as m}from"./userProfileFixtures-CyNsihKp.js";import{a as h,r as g}from"./SettingsEntryList-CDm7_Oge.js";import{n as _,t as v}from"./ProfileAccountLinking-D109RGML.js";var y,b,x,S,C,w,T,E,D,O;e((()=>{y=t(),i(),h(),n(),u(),_(),b={title:`Organisms/Settings/ProfileAccountLinking`,component:v,decorators:[e=>(0,y.jsx)(r,{children:(0,y.jsx)(a,{children:(0,y.jsx)(g,{label:`账号安全`,children:(0,y.jsx)(e,{})})})})],args:{googleIdentity:s,isLast:!0,linkAction:f,linkFeedback:null,unlinkAction:p}},x={name:`未绑定（点击绑定后等待跳转）`},S={name:`未绑定（无法连接 Google）`,args:{linkAction:l}},C={name:`已绑定（可解除绑定）`,args:{googleIdentity:m}},w={name:`已绑定（解除绑定失败）`,args:{googleIdentity:m,unlinkAction:o}},T={name:`已绑定（Google 是唯一登录身份，禁止解除）`,args:{googleIdentity:c}},E={name:`Google 授权回跳：绑定成功`,args:{googleIdentity:m,linkFeedback:{kind:`success`}}},D={name:`Google 授权回跳：该 Google 账号已被其他用户使用`,args:{linkFeedback:{kind:`failure`,message:d}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "未绑定（点击绑定后等待跳转）"
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "未绑定（无法连接 Google）",
  args: {
    linkAction: failedLinkGoogleIdentityAction
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "已绑定（可解除绑定）",
  args: {
    googleIdentity: unlinkableGoogleIdentity
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "已绑定（解除绑定失败）",
  args: {
    googleIdentity: unlinkableGoogleIdentity,
    unlinkAction: failedUnlinkGoogleIdentityAction
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "已绑定（Google 是唯一登录身份，禁止解除）",
  args: {
    googleIdentity: googleOnlyIdentity
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "Google 授权回跳：绑定成功",
  args: {
    googleIdentity: unlinkableGoogleIdentity,
    linkFeedback: {
      kind: "success"
    }
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "Google 授权回跳：该 Google 账号已被其他用户使用",
  args: {
    linkFeedback: {
      kind: "failure",
      message: googleIdentityAlreadyExistsMessage
    }
  }
}`,...D.parameters?.docs?.source}}},O=[`Unlinked`,`LinkStartFailed`,`Linked`,`UnlinkFailed`,`GoogleOnly`,`LinkedFromCallback`,`IdentityAlreadyExists`]}))();export{T as GoogleOnly,D as IdentityAlreadyExists,S as LinkStartFailed,C as Linked,E as LinkedFromCallback,w as UnlinkFailed,x as Unlinked,O as __namedExportsOrder,b as default};