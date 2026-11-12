import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{i as n,n as r,r as i,t as a}from"./MerchantDetailsFields-HwlboFbD.js";import{i as o,r as s,t as c}from"./merchant-7_OO_LY8.js";var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{l=t(),i(),c(),r(),{expect:u,userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p=async()=>({iconUrl:`https://t2.gstatic.com/faviconV2?url=https://example.com`,success:`网站图标已获取，保存后会缓存`}),m={title:`Organisms/Merchants/MerchantDetailsFields`,component:a,render:function(e){let t=n(e);return(0,l.jsx)(a,{...e,name:t.name,note:t.note,websiteUrl:t.websiteUrl,previewIconUrl:t.previewIconUrl,onNameChange:t.setName,onNoteChange:t.setNote,onWebsiteUrlChange:t.setWebsiteUrl,onPreviewIconChange:t.setPreviewIconUrl})},args:{fetchIconAction:p,previewIconUrl:``,onPreviewIconChange:()=>{},ledgerId:`ledger-1`,name:`示例商家`,note:``,onNameChange:()=>{},onNoteChange:()=>{},onWebsiteUrlChange:()=>{},websiteUrl:`https://example.com`}},h={name:`获取前`},g={name:`空值：聚焦与失焦对照`,args:{name:``,websiteUrl:``,note:``}},_={...g,name:`空值：商家名称聚焦`,play:async({canvasElement:e})=>{let t=f(e).getByRole(`textbox`,{name:/商家名称/});await d.click(t),await u(t).toHaveFocus()}},v={...g,name:`空值：商家网址聚焦`,play:async({canvasElement:e})=>{let t=f(e).getByRole(`textbox`,{name:`商家网址`});await d.click(t),await u(t).toHaveFocus()}},y={...g,name:`空值：备注聚焦`,play:async({canvasElement:e})=>{let t=f(e).getByRole(`textbox`,{name:`备注（可选）`});await d.click(t),await u(t).toHaveFocus()}},b={args:{fetchIconAction:()=>new Promise(()=>{})},name:`获取中`,play:async({canvasElement:e})=>{await d.click(f(e).getByRole(`button`,{name:`获取图标`})),await u(f(e).getByText(`正在获取并验证网站图标`)).toBeInTheDocument()}},x={args:{previewIconUrl:`https://t2.gstatic.com/faviconV2?url=https://example.com`},name:`获取成功`},S={args:{fetchIconAction:async()=>({error:o[s.merchantIconFetchFailed]})},name:`获取失败`,play:async({canvasElement:e})=>{await d.click(f(e).getByRole(`button`,{name:`获取图标`})),await u(await f(e).findByText(o[s.merchantIconFetchFailed])).toBeInTheDocument()}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "获取前"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "空值：聚焦与失焦对照",
  args: {
    name: "",
    websiteUrl: "",
    note: ""
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  ...EmptyFields,
  name: "空值：商家名称聚焦",
  play: async ({
    canvasElement
  }) => {
    const field = within(canvasElement).getByRole("textbox", {
      name: /商家名称/
    });
    await userEvent.click(field);
    await expect(field).toHaveFocus();
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  ...EmptyFields,
  name: "空值：商家网址聚焦",
  play: async ({
    canvasElement
  }) => {
    const field = within(canvasElement).getByRole("textbox", {
      name: "商家网址"
    });
    await userEvent.click(field);
    await expect(field).toHaveFocus();
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  ...EmptyFields,
  name: "空值：备注聚焦",
  play: async ({
    canvasElement
  }) => {
    const field = within(canvasElement).getByRole("textbox", {
      name: "备注（可选）"
    });
    await userEvent.click(field);
    await expect(field).toHaveFocus();
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    fetchIconAction: () => new Promise(() => {})
  },
  name: "获取中",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "获取图标"
    }));
    await expect(within(canvasElement).getByText("正在获取并验证网站图标")).toBeInTheDocument();
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    previewIconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com"
  },
  name: "获取成功"
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    fetchIconAction: async () => ({
      error: merchantErrorMessages[merchantErrorCodes.merchantIconFetchFailed]
    })
  },
  name: "获取失败",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "获取图标"
    }));
    await expect(await within(canvasElement).findByText(merchantErrorMessages[merchantErrorCodes.merchantIconFetchFailed])).toBeInTheDocument();
  }
}`,...S.parameters?.docs?.source}}},C=[`Idle`,`EmptyFields`,`NameFocused`,`WebsiteFocused`,`NoteFocused`,`Loading`,`Success`,`Error`]}))();export{g as EmptyFields,S as Error,h as Idle,b as Loading,_ as NameFocused,y as NoteFocused,x as Success,v as WebsiteFocused,C as __namedExportsOrder,m as default};