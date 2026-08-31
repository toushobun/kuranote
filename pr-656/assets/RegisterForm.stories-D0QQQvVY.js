import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{a as n,i as r,n as i,o as a,r as o,t as s}from"./turnstileTestDouble-B7JYkvo3.js";async function c(e){let t=f(e);await u.type(t.getByLabelText(/邮箱/),`yamada@example.test`),await u.type(t.getByLabelText(/昵称/),`山田太郎`),await u.type(t.getByLabelText(/^密码/),`password123`),await u.type(t.getByLabelText(/确认密码/),`password123`),await d(()=>{if(t.getByRole(`button`,{name:`获取验证码`}).hasAttribute(`disabled`))throw Error(`等待 Turnstile 响应`)})}var l,u,d,f,p,m,h,g,_,v,y,b,x;e((()=>{l=t(),n(),r(),s(),{userEvent:u,waitFor:d,within:f}=__STORYBOOK_MODULE_TEST__,p={title:`Organisms/Auth/RegisterForm`,component:o,decorators:[e=>(i(),(0,l.jsx)(e,{}))],args:{checkEmailAvailabilityAction:async()=>({available:!0}),requestOtpAction:async()=>({}),submitOtpAction:async()=>({}),turnstileSiteKey:a}},m={name:`初始填写`},h={name:`邮箱检查中`,args:{checkEmailAvailabilityAction:()=>new Promise(()=>{})},play:async({canvasElement:e})=>{let t=f(e);await u.type(t.getByLabelText(/邮箱/),`checking@example.test`),await u.tab(),await t.findByText(`正在检查邮箱可用性`)}},g={name:`邮箱可用`,play:async({canvasElement:e})=>{let t=f(e);await u.type(t.getByLabelText(/邮箱/),`available@example.test`),await u.tab(),await t.findByText(`该邮箱可用`)}},_={name:`邮箱已注册`,args:{checkEmailAvailabilityAction:async()=>({available:!1,error:`该邮箱已被注册`,reason:`email_exists`})},play:async({canvasElement:e})=>{let t=f(e);await u.type(t.getByLabelText(/邮箱/),`registered@example.test`),await u.tab(),await t.findByText(`该邮箱已被注册，前往`),await t.findByRole(`link`,{name:`登录`})}},v={name:`OTP 输入`,args:{requestOtpAction:async()=>({status:`success`,success:`验证码已发送。`})},play:async({canvasElement:e})=>{let t=f(e);await c(e),await u.click(t.getByRole(`button`,{name:`获取验证码`}))}},y={name:`重新发送`,args:{requestOtpAction:async()=>({retryAfterSeconds:0,status:`success`,success:`验证码已发送。`})},play:async({canvasElement:e})=>{let t=f(e);await c(e),await u.click(t.getByRole(`button`,{name:`获取验证码`}))}},b={name:`验证码错误`,args:{requestOtpAction:async()=>({status:`success`}),submitOtpAction:async()=>({error:`验证码不正确或已过期，请重新获取`,remainingAttempts:4,status:`otp_invalid`})},play:async({canvasElement:e})=>{let t=f(e);await c(e),await u.click(t.getByRole(`button`,{name:`获取验证码`})),await u.type(await t.findByLabelText(/验证码/),`012345`),await u.click(t.getByRole(`button`,{name:`完成注册`}))}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "初始填写"
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "邮箱检查中",
  args: {
    checkEmailAvailabilityAction: () => new Promise(() => {})
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/邮箱/), "checking@example.test");
    await userEvent.tab();
    await canvas.findByText("正在检查邮箱可用性");
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "邮箱可用",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/邮箱/), "available@example.test");
    await userEvent.tab();
    await canvas.findByText("该邮箱可用");
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "邮箱已注册",
  args: {
    checkEmailAvailabilityAction: async () => ({
      available: false,
      error: "该邮箱已被注册",
      reason: "email_exists"
    })
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/邮箱/), "registered@example.test");
    await userEvent.tab();
    await canvas.findByText("该邮箱已被注册，前往");
    await canvas.findByRole("link", {
      name: "登录"
    });
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "OTP 输入",
  args: {
    requestOtpAction: async () => ({
      status: "success",
      success: "验证码已发送。"
    })
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await fillRegisterFields(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "获取验证码"
    }));
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "重新发送",
  args: {
    requestOtpAction: async () => ({
      retryAfterSeconds: 0,
      status: "success",
      success: "验证码已发送。"
    })
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await fillRegisterFields(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "获取验证码"
    }));
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "验证码错误",
  args: {
    requestOtpAction: async () => ({
      status: "success"
    }),
    submitOtpAction: async () => ({
      error: "验证码不正确或已过期，请重新获取",
      remainingAttempts: 4,
      status: "otp_invalid"
    })
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await fillRegisterFields(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "获取验证码"
    }));
    await userEvent.type(await canvas.findByLabelText(/验证码/), "012345");
    await userEvent.click(canvas.getByRole("button", {
      name: "完成注册"
    }));
  }
}`,...b.parameters?.docs?.source}}},x=[`Default`,`EmailChecking`,`EmailAvailable`,`EmailAlreadyRegistered`,`OtpInput`,`ResendReady`,`SubmitError`]}))();export{m as Default,_ as EmailAlreadyRegistered,g as EmailAvailable,h as EmailChecking,v as OtpInput,y as ResendReady,b as SubmitError,x as __namedExportsOrder,p as default};