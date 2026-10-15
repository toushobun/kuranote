import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./CategoryForm-2mJ2ao9u.js";var r,i,a,o,s,c,l,u,d,f;e((()=>{t(),{expect:r,userEvent:i,within:a}=__STORYBOOK_MODULE_TEST__,o={title:`Organisms/Categories/CategoryForm`,component:n,args:{createCategoryAction:async()=>{},parentOptions:[{id:`expense-food`,name:`🍽️ 餐饮`,type:`expense`},{id:`expense-transport`,name:`🚃 交通`,type:`expense`},{id:`income-main`,name:`💰 收入`,type:`income`}]}},s={name:`新增分类弹窗`},c={name:`新增收入小分类`,play:async({canvasElement:e})=>{await i.click(a(e).getByRole(`button`,{name:`新增分类`}));let t=a(e.ownerDocument.body);await i.click(t.getByRole(`combobox`,{name:`分类类型`})),await i.click(t.getByRole(`option`,{name:`收入`})),await i.click(t.getByRole(`combobox`,{name:`上级分类`})),await r(t.queryByRole(`option`,{name:`🍽️ 餐饮`})).not.toBeInTheDocument(),await i.click(t.getByRole(`option`,{name:`💰 收入`}))}},l={name:`新增表单确认分类图标`,play:async({canvasElement:e})=>{await i.click(a(e).getByRole(`button`,{name:`新增分类`}));let t=a(e.ownerDocument.body);await i.click(t.getByRole(`button`,{name:`选择图标`}));let n=a(t.getByRole(`dialog`,{name:`选择图标`}));await i.click(n.getByRole(`button`,{name:`选择面条图标`})),await i.click(n.getByRole(`button`,{name:`确定`})),await r(t.getByLabelText(`当前分类图标：🍜`)).toBeVisible()}},u={name:`没有上级分类候选`,args:{parentOptions:[]},play:async({canvasElement:e})=>{await i.click(a(e).getByRole(`button`,{name:`新增分类`}))}},d={name:`新增弹窗等宽按钮`,play:async({canvasElement:e})=>{await i.click(a(e).getByRole(`button`,{name:`新增分类`}));let t=a(await a(e.ownerDocument.body).findByRole(`dialog`)),n=t.getByRole(`button`,{name:`取消`}),o=t.getByRole(`button`,{name:`新增分类`});await r(n.getBoundingClientRect().width).toBeCloseTo(o.getBoundingClientRect().width,0),await r(n.getBoundingClientRect().top).toBe(o.getBoundingClientRect().top)}},s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "新增分类弹窗"
}`,...s.parameters?.docs?.source}}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "新增收入小分类",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "新增分类"
    }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("combobox", {
      name: "分类类型"
    }));
    await userEvent.click(body.getByRole("option", {
      name: "收入"
    }));
    await userEvent.click(body.getByRole("combobox", {
      name: "上级分类"
    }));
    await expect(body.queryByRole("option", {
      name: "🍽️ 餐饮"
    })).not.toBeInTheDocument();
    await userEvent.click(body.getByRole("option", {
      name: "💰 收入"
    }));
  }
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: "新增表单确认分类图标",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "新增分类"
    }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", {
      name: "选择图标"
    }));
    const picker = within(body.getByRole("dialog", {
      name: "选择图标"
    }));
    await userEvent.click(picker.getByRole("button", {
      name: "选择面条图标"
    }));
    await userEvent.click(picker.getByRole("button", {
      name: "确定"
    }));
    await expect(body.getByLabelText("当前分类图标：🍜")).toBeVisible();
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  name: "没有上级分类候选",
  args: {
    parentOptions: []
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "新增分类"
    }));
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "新增弹窗等宽按钮",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "新增分类"
    }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    const cancel = dialog.getByRole("button", {
      name: "取消"
    });
    const submit = dialog.getByRole("button", {
      name: "新增分类"
    });
    await expect(cancel.getBoundingClientRect().width).toBeCloseTo(submit.getBoundingClientRect().width, 0);
    await expect(cancel.getBoundingClientRect().top).toBe(submit.getBoundingClientRect().top);
  }
}`,...d.parameters?.docs?.source}}},f=[`Default`,`IncomeChild`,`SelectedIcon`,`EmptyParentOptions`,`DialogButtons`]}))();export{s as Default,d as DialogButtons,u as EmptyParentOptions,c as IncomeChild,l as SelectedIcon,f as __namedExportsOrder,o as default};