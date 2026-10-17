import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{a as i,n as a,t as o}from"./categoryEmojis-97W7iB8O.js";import{n as s,t as c}from"./GroupedIconPicker-DNA-nvLo.js";var l,u,d,f,p,m,h,g,_,v,y,b;t((()=>{l=r(),i(),u=e(n()),s(),{expect:d,userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m={title:`Molecules/UI/GroupedIconPicker`,component:c,args:{fieldLabel:`记录图标`,helperText:`选择用于记录的图标。`,inputName:`recordIcon`,value:`☕`,onChange:()=>{},groups:[{id:`food`,label:`餐饮`,groupIcon:`🍴`},{id:`travel`,label:`出行`}],options:[{emoji:`☕`,groupId:`food`,label:`咖啡`,keywords:[]},{emoji:`🍜`,groupId:`food`,label:`面条`,keywords:[]},{emoji:`🚃`,groupId:`travel`,label:`电车`,keywords:[]}]},render:function(e){let[t,n]=(0,u.useState)(e.value);return(0,l.jsx)(c,{...e,value:t,onChange:n})}},h={name:`图标字段`},g={name:`小弹窗分组与草稿选中态`,play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`选择图标`}));let t=p(await p(e.ownerDocument.body).findByRole(`dialog`));await d(t.getByRole(`heading`,{name:`餐饮 2个图标`})).toBeVisible(),await d(t.getByRole(`heading`,{name:`出行 1个图标`})).toBeVisible(),await f.click(t.getByRole(`button`,{name:`选择电车图标`})),await d(t.getByRole(`button`,{name:`选择电车图标`})).toHaveAttribute(`aria-pressed`,`true`)}},_={name:`空分组`,args:{options:[]},play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`选择图标`}))}},v={name:`旧图标不可确认，重选有效图标`,args:{value:`📁`},play:async({canvasElement:e})=>{let t=p(e);await f.click(t.getByRole(`button`,{name:`选择图标`}));let n=p(await p(e.ownerDocument.body).findByRole(`dialog`)),r=n.getByRole(`button`,{name:`确定`});await d(r).toBeDisabled(),await f.click(n.getByRole(`button`,{name:`选择面条图标`})),await d(r).toBeEnabled(),await f.click(r),await d(t.getByLabelText(`当前记录图标：🍜`)).toBeVisible()}},y={...g,name:`小弹窗完整分类图标库`,args:{groups:o,options:a,value:`🍜`},play:async({canvasElement:e})=>{await f.click(p(e).getByRole(`button`,{name:`选择图标`}));let t=await p(e.ownerDocument.body).findByRole(`dialog`);await d(t).not.toHaveClass(`MuiDialog-paperFullScreen`),await d(t).toHaveClass(`MuiDialog-paperFullWidth`,`MuiDialog-paperWidthSm`),await d(p(t).getAllByRole(`region`)).toHaveLength(8)}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "图标字段"
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "小弹窗分组与草稿选中态",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择图标"
    }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await expect(dialog.getByRole("heading", {
      name: "餐饮 2个图标"
    })).toBeVisible();
    await expect(dialog.getByRole("heading", {
      name: "出行 1个图标"
    })).toBeVisible();
    await userEvent.click(dialog.getByRole("button", {
      name: "选择电车图标"
    }));
    await expect(dialog.getByRole("button", {
      name: "选择电车图标"
    })).toHaveAttribute("aria-pressed", "true");
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "空分组",
  args: {
    options: []
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择图标"
    }));
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "旧图标不可确认，重选有效图标",
  args: {
    value: "📁"
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "选择图标"
    }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    const confirm = dialog.getByRole("button", {
      name: "确定"
    });
    await expect(confirm).toBeDisabled();
    await userEvent.click(dialog.getByRole("button", {
      name: "选择面条图标"
    }));
    await expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await expect(canvas.getByLabelText("当前记录图标：🍜")).toBeVisible();
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  ...Grouped,
  name: "小弹窗完整分类图标库",
  args: {
    groups: categoryEmojiGroups,
    options: categoryEmojiOptions,
    value: "🍜"
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "选择图标"
    }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("dialog");
    await expect(dialog).not.toHaveClass("MuiDialog-paperFullScreen");
    await expect(dialog).toHaveClass("MuiDialog-paperFullWidth", "MuiDialog-paperWidthSm");
    await expect(within(dialog).getAllByRole("region")).toHaveLength(8);
  }
}`,...y.parameters?.docs?.source}}},b=[`Default`,`Grouped`,`Empty`,`UnavailableValue`,`CategoryGroups`]}))();export{y as CategoryGroups,h as Default,_ as Empty,g as Grouped,v as UnavailableValue,b as __namedExportsOrder,m as default};