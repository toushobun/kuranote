import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Box-DhuaKSkS.js";import{n as i,t as a}from"./Typography-CwLqrFKa.js";import{a as o,n as s}from"./paths-B1Daueo6.js";import{n as c,t as l}from"./Paper-BdT5O-LH.js";import{n as u,t as d}from"./GoogleAuthSection-m1s2fYfk.js";import{a as f,i as p,n as m,o as h,r as g,t as _}from"./turnstileTestDouble-DtyhrSBX.js";import{n as v,t as y}from"./Link-medV8imF.js";import{n as b,t as x}from"./Container-6ALDp3Xp.js";function S({checkEmailAvailabilityAction:e,googleAction:t,googleErrorMessage:r,initialRequestOtpState:a,loginHref:s=o.login,requestOtpAction:l,submitOtpAction:u,turnstileSiteKey:f}){return(0,C.jsx)(n,{component:`main`,sx:{alignItems:`center`,display:`flex`,minHeight:`100vh`,py:8},children:(0,C.jsx)(b,{maxWidth:`xs`,children:(0,C.jsxs)(c,{elevation:0,sx:{border:`1px solid`,borderColor:`divider`,p:{xs:4,sm:5}},children:[(0,C.jsx)(i,{component:`h1`,variant:`h4`,sx:{fontWeight:700},children:`KuraNote`}),(0,C.jsx)(i,{color:`text.secondary`,sx:{mt:1,mb:4},children:`创建账号后开始使用记账功能`}),t||r?(0,C.jsx)(d,{action:t,errorMessage:r}):null,(0,C.jsx)(g,{checkEmailAvailabilityAction:e,initialRequestOtpState:a,requestOtpAction:l,submitOtpAction:u,turnstileSiteKey:f}),(0,C.jsxs)(i,{color:`text.secondary`,sx:{mt:3,textAlign:`center`},children:[`已有账号？ `,(0,C.jsx)(v,{href:s,children:`登录`})]})]})})})}var C,w=e((()=>{C=t(),r(),x(),y(),l(),a(),s(),u(),p(),S.__docgenInfo={description:``,methods:[],displayName:`RegisterTemplate`,props:{checkEmailAvailabilityAction:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(
  email: string,
) => Promise<RegisterEmailAvailabilityState>`,signature:{arguments:[{type:{name:`string`},name:`email`}],return:{name:`Promise`,elements:[{name:`RegisterEmailAvailabilityState`}],raw:`Promise<RegisterEmailAvailabilityState>`}}},description:``},googleAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`() => Promise<void>`,signature:{arguments:[],return:{name:`Promise`,elements:[{name:`void`}],raw:`Promise<void>`}}},description:``},googleErrorMessage:{required:!1,tsType:{name:`string`},description:``},initialRequestOtpState:{required:!1,tsType:{name:`RequestRegisterOtpActionState`},description:``},loginHref:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`routePaths.login`,computed:!0}},requestOtpAction:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(
  prevState: RequestRegisterOtpActionState,
  formData: FormData,
) => Promise<RequestRegisterOtpActionState>`,signature:{arguments:[{type:{name:`RequestRegisterOtpActionState`},name:`prevState`},{type:{name:`FormData`},name:`formData`}],return:{name:`Promise`,elements:[{name:`RequestRegisterOtpActionState`}],raw:`Promise<RequestRegisterOtpActionState>`}}},description:``},submitOtpAction:{required:!0,tsType:{name:`signature`,type:`function`,raw:`(
  prevState: SubmitRegisterOtpActionState,
  formData: FormData,
) => Promise<SubmitRegisterOtpActionState>`,signature:{arguments:[{type:{name:`SubmitRegisterOtpActionState`},name:`prevState`},{type:{name:`FormData`},name:`formData`}],return:{name:`Promise`,elements:[{name:`SubmitRegisterOtpActionState`}],raw:`Promise<SubmitRegisterOtpActionState>`}}},description:``},turnstileSiteKey:{required:!0,tsType:{name:`string`},description:``}}}}));async function T(){return{}}async function E(){return{available:!0}}async function D(){}async function O(){return{}}var k,A,j,M,N,P,F;e((()=>{k=t(),f(),_(),w(),A={title:`Templates/Register/RegisterTemplate`,component:S,parameters:{nextjs:{appDirectory:!0,navigation:{pathname:`/register`}}},decorators:[e=>(m(),(0,k.jsx)(e,{}))],args:{checkEmailAvailabilityAction:E,googleAction:D,requestOtpAction:T,submitOtpAction:O,turnstileSiteKey:h}},j={name:`注册页面`},M={name:`含验证码错误提示`,args:{initialRequestOtpState:{error:`验证码发送失败，请稍后再试。`}}},N={name:`含 Google 登录错误提示`,args:{googleErrorMessage:`Google 登录未完成，请重新尝试或改用邮箱方式。`}},P={name:`含成功提示`,args:{initialRequestOtpState:{success:`验证码已发送。`}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "注册页面"
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "含验证码错误提示",
  args: {
    initialRequestOtpState: {
      error: "验证码发送失败，请稍后再试。"
    }
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "含 Google 登录错误提示",
  args: {
    googleErrorMessage: "Google 登录未完成，请重新尝试或改用邮箱方式。"
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "含成功提示",
  args: {
    initialRequestOtpState: {
      success: "验证码已发送。"
    }
  }
}`,...P.parameters?.docs?.source}}},F=[`Default`,`WithError`,`WithGoogleError`,`WithSuccess`]}))();export{j as Default,M as WithError,N as WithGoogleError,P as WithSuccess,F as __namedExportsOrder,A as default};