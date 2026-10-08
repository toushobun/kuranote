import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{i,r as a,t as o}from"./merchant-DZl1uvRc.js";import{n as s,t as c}from"./MerchantDetailsFields-UXLcwfdg.js";var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w;t((()=>{l=r(),u=e(n()),o(),s(),{expect:d,userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m=async()=>({iconUrl:`https://t2.gstatic.com/faviconV2?url=https://example.com`,success:`网站图标已获取，保存后会缓存`}),h={title:`Organisms/Merchants/MerchantDetailsFields`,component:c,args:{fetchIconAction:m,ledgerId:`ledger-1`,name:`示例商家`,note:``,onNameChange:()=>{},onNoteChange:()=>{},onWebsiteUrlChange:()=>{},websiteUrl:`https://example.com`}},g={name:`获取前`},_={name:`空值：聚焦与失焦对照`,args:{name:``,websiteUrl:``,note:``},render:function(e){let[t,n]=(0,u.useState)(e.name),[r,i]=(0,u.useState)(e.websiteUrl),[a,o]=(0,u.useState)(e.note);return(0,l.jsx)(c,{...e,name:t,websiteUrl:r,note:a,onNameChange:n,onWebsiteUrlChange:i,onNoteChange:o})}},v={..._,name:`空值：商家名称聚焦`,play:async({canvasElement:e})=>{let t=p(e).getByRole(`textbox`,{name:/商家名称/});await f.click(t),await d(t).toHaveFocus()}},y={..._,name:`空值：商家网址聚焦`,play:async({canvasElement:e})=>{let t=p(e).getByRole(`textbox`,{name:`商家网址`});await f.click(t),await d(t).toHaveFocus()}},b={..._,name:`空值：备注聚焦`,play:async({canvasElement:e})=>{let t=p(e).getByRole(`textbox`,{name:`备注（可选）`});await f.click(t),await d(t).toHaveFocus()}},x={args:{fetchIconAction:()=>new Promise(()=>{})},name:`获取中`,play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`获取图标`})),await d(p(e).getByText(`正在获取并验证网站图标`)).toBeInTheDocument()}},S={args:{initialIconUrl:`https://t2.gstatic.com/faviconV2?url=https://example.com`},name:`获取成功`},C={args:{fetchIconAction:async()=>({error:i[a.merchantIconFetchFailed]})},name:`获取失败`,play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`获取图标`})),await d(await p(e).findByText(i[a.merchantIconFetchFailed])).toBeInTheDocument()}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "获取前"
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "空值：聚焦与失焦对照",
  args: {
    name: "",
    websiteUrl: "",
    note: ""
  },
  render: function EmptyFieldsStory(args) {
    const [name, setName] = useState(args.name);
    const [websiteUrl, setWebsiteUrl] = useState(args.websiteUrl);
    const [note, setNote] = useState(args.note);
    return <MerchantDetailsFields {...args} name={name} websiteUrl={websiteUrl} note={note} onNameChange={setName} onWebsiteUrlChange={setWebsiteUrl} onNoteChange={setNote} />;
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    initialIconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com"
  },
  name: "获取成功"
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
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
}`,...C.parameters?.docs?.source}}},w=[`Idle`,`EmptyFields`,`NameFocused`,`WebsiteFocused`,`NoteFocused`,`Loading`,`Success`,`Error`]}))();export{_ as EmptyFields,C as Error,g as Idle,x as Loading,v as NameFocused,b as NoteFocused,S as Success,y as WebsiteFocused,w as __namedExportsOrder,h as default};