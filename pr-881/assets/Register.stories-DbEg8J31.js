import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-COgO7ONn.js";import{n as i,t as a}from"./Typography-BEv3yknI.js";import{n as o,t as s}from"./Paper-DQTGXAmy.js";import{a as c,n as l}from"./paths-t1fEWS--.js";import{n as u,t as d}from"./GoogleAuthSection-4pHVlfAO.js";import{o as f,t as p}from"./auth-DyUMq799.js";import{a as m,i as h,n as g,o as _,r as v,t as y}from"./turnstileTestDouble-CxQBEV27.js";import{n as b,t as x}from"./Link-CUC5ppPz.js";import{n as S,t as C}from"./Container-C3V4p8dN.js";function w({checkEmailAvailabilityAction:e,googleAction:t,googleErrorMessage:r,initialRequestOtpState:a,loginHref:s=c.login,requestOtpAction:l,submitOtpAction:u,turnstileSiteKey:f}){return(0,T.jsx)(n,{component:`main`,sx:{alignItems:`center`,display:`flex`,minHeight:`100vh`,py:8},children:(0,T.jsx)(S,{maxWidth:`xs`,children:(0,T.jsxs)(o,{elevation:0,sx:{border:`1px solid`,borderColor:`divider`,p:{xs:4,sm:5}},children:[(0,T.jsx)(i,{component:`h1`,variant:`h4`,sx:{fontWeight:700},children:`KuraNote`}),(0,T.jsx)(i,{color:`text.secondary`,sx:{mt:1,mb:4},children:`创建账号后开始使用记账功能`}),t||r?(0,T.jsx)(d,{action:t,errorMessage:r}):null,(0,T.jsx)(v,{checkEmailAvailabilityAction:e,initialRequestOtpState:a,requestOtpAction:l,submitOtpAction:u,turnstileSiteKey:f}),(0,T.jsxs)(i,{color:`text.secondary`,sx:{mt:3,textAlign:`center`},children:[`已有账号？ `,(0,T.jsx)(b,{href:s,children:`登录`})]})]})})})}var T,E=e((()=>{T=t(),r(),C(),x(),s(),a(),l(),u(),h(),w.__docgenInfo={description:``,methods:[],displayName:`RegisterTemplate`,props:{checkEmailAvailabilityAction:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(
  email: string,
) => Promise<RegisterEmailAvailabilityState>`,signature:{arguments:[{type:{name:`string`},name:`email`}],return:{name:`Promise`,elements:[{name:`RegisterEmailAvailabilityState`}],raw:`Promise<RegisterEmailAvailabilityState>`}}},description:``},googleAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => Promise<void>`,signature:{arguments:[],return:{name:`Promise`,elements:[{name:`void`}],raw:`Promise<void>`}}},description:``},googleErrorMessage:{required:!1,tsType:{name:`string`},description:``},initialRequestOtpState:{required:!1,tsType:{name:`RequestRegisterOtpActionState`},description:``},loginHref:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`routePaths.login`,computed:!0}},requestOtpAction:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(
  prevState: RequestRegisterOtpActionState,
  formData: FormData,
) => Promise<RequestRegisterOtpActionState>`,signature:{arguments:[{type:{name:`RequestRegisterOtpActionState`},name:`prevState`},{type:{name:`FormData`},name:`formData`}],return:{name:`Promise`,elements:[{name:`RequestRegisterOtpActionState`}],raw:`Promise<RequestRegisterOtpActionState>`}}},description:``},submitOtpAction:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(
  prevState: SubmitRegisterOtpActionState,
  formData: FormData,
) => Promise<SubmitRegisterOtpActionState>`,signature:{arguments:[{type:{name:`SubmitRegisterOtpActionState`},name:`prevState`},{type:{name:`FormData`},name:`formData`}],return:{name:`Promise`,elements:[{name:`SubmitRegisterOtpActionState`}],raw:`Promise<SubmitRegisterOtpActionState>`}}},description:``},turnstileSiteKey:{required:!0,tsType:{name:`string`},description:``}}}}));async function D(){return{}}async function O(){return{available:!0}}async function k(){}async function A(){return{}}var j,M,N,P,F,I,L;e((()=>{j=t(),m(),p(),y(),E(),M={title:`Templates/Register/RegisterTemplate`,component:w,parameters:{nextjs:{appDirectory:!0,navigation:{pathname:`/register`}}},decorators:[e=>(g(),(0,j.jsx)(e,{}))],args:{checkEmailAvailabilityAction:O,googleAction:k,requestOtpAction:D,submitOtpAction:A,turnstileSiteKey:_}},N={name:`注册页面`},P={name:`含验证码错误提示`,args:{initialRequestOtpState:{error:f.resendFailed}}},F={name:`含 Google 登录错误提示`,args:{googleErrorMessage:`Google 登录未完成，请重新尝试或改用邮箱方式。`}},I={name:`含成功提示`,args:{initialRequestOtpState:{success:`验证码已发送。`}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "注册页面"
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "含验证码错误提示",
  args: {
    initialRequestOtpState: {
      error: registerOtpMessages.resendFailed
    }
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "含 Google 登录错误提示",
  args: {
    googleErrorMessage: "Google 登录未完成，请重新尝试或改用邮箱方式。"
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "含成功提示",
  args: {
    initialRequestOtpState: {
      success: "验证码已发送。"
    }
  }
}`,...I.parameters?.docs?.source}}},L=[`Default`,`WithError`,`WithGoogleError`,`WithSuccess`]}))();export{N as Default,P as WithError,F as WithGoogleError,I as WithSuccess,L as __namedExportsOrder,M as default};