import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{o as n,t as r}from"./auth-DyUMq799.js";import{a as i,i as a,n as o,o as s,r as c,t as l}from"./turnstileTestDouble-8UQRBp2D.js";async function u(e){let t=m(e);await f.type(t.getByLabelText(/邮箱/),`yamada@example.test`),await f.type(t.getByLabelText(/昵称/),`山田太郎`),await f.type(t.getByLabelText(/^密码/),`password123`),await f.type(t.getByLabelText(/确认密码/),`password123`),await p(()=>{if(t.getByRole(`button`,{name:`获取验证码`}).hasAttribute(`disabled`))throw Error(`等待 Turnstile 响应`)})}var d,f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{d=t(),i(),r(),a(),l(),{userEvent:f,waitFor:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Auth/RegisterForm`,component:c,decorators:[e=>(o(),(0,d.jsx)(e,{}))],args:{checkEmailAvailabilityAction:async()=>({available:!0}),requestOtpAction:async()=>({}),submitOtpAction:async()=>({}),turnstileSiteKey:s}},g={name:`初始填写`},_={name:`邮箱检查中`,args:{checkEmailAvailabilityAction:()=>new Promise(()=>{})},play:async({canvasElement:e})=>{let t=m(e);await f.type(t.getByLabelText(/邮箱/),`checking@example.test`),await f.tab(),await t.findByText(`正在检查邮箱可用性`)}},v={name:`邮箱可用`,play:async({canvasElement:e})=>{let t=m(e);await f.type(t.getByLabelText(/邮箱/),`available@example.test`),await f.tab(),await t.findByText(`该邮箱可用`)}},y={name:`邮箱已注册`,args:{checkEmailAvailabilityAction:async()=>({available:!1,error:`该邮箱已被注册`,reason:`email_exists`})},play:async({canvasElement:e})=>{let t=m(e);await f.type(t.getByLabelText(/邮箱/),`registered@example.test`),await f.tab(),await t.findByText(`该邮箱已被注册，前往`),await t.findByRole(`link`,{name:`登录`})}},b={name:`OTP 输入`,args:{requestOtpAction:async()=>({status:`success`,success:`验证码已发送。`})},play:async({canvasElement:e})=>{let t=m(e);await u(e),await f.click(t.getByRole(`button`,{name:`获取验证码`}))}},x={name:`重新发送`,args:{requestOtpAction:async()=>({retryAfterSeconds:0,status:`success`,success:`验证码已发送。`})},play:async({canvasElement:e})=>{let t=m(e);await u(e),await f.click(t.getByRole(`button`,{name:`获取验证码`}))}},S={name:`验证码错误`,args:{requestOtpAction:async()=>({status:`success`}),submitOtpAction:async()=>({error:n.invalidOtp,remainingAttempts:4,status:`otp_invalid`})},play:async({canvasElement:e})=>{let t=m(e);await u(e),await f.click(t.getByRole(`button`,{name:`获取验证码`})),await f.type(await t.findByLabelText(/验证码/),`012345`),await f.click(t.getByRole(`button`,{name:`完成注册`}))}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "初始填写"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "邮箱可用",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText(/邮箱/), "available@example.test");
    await userEvent.tab();
    await canvas.findByText("该邮箱可用");
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "验证码错误",
  args: {
    requestOtpAction: async () => ({
      status: "success"
    }),
    submitOtpAction: async () => ({
      error: registerOtpMessages.invalidOtp,
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
}`,...S.parameters?.docs?.source}}},C=[`Default`,`EmailChecking`,`EmailAvailable`,`EmailAlreadyRegistered`,`OtpInput`,`ResendReady`,`SubmitError`]}))();export{g as Default,y as EmailAlreadyRegistered,v as EmailAvailable,_ as EmailChecking,b as OtpInput,x as ResendReady,S as SubmitError,C as __namedExportsOrder,h as default};