import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-7ZtwB18g.js";import{n as i,t as a}from"./CategoryList-DI0Yvs9s.js";var o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x,S;e((()=>{o=t(),n(),i(),{expect:s,userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u=[{children:[{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍞`,id:`00000000-0000-4000-8000-000000000103`,name:`早餐`,parent_id:`00000000-0000-4000-8000-000000000101`,sort_order:10,type:`expense`},{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍜`,id:`00000000-0000-4000-8000-000000000104`,name:`外食`,parent_id:`00000000-0000-4000-8000-000000000101`,sort_order:20,type:`expense`}],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍽️`,id:`00000000-0000-4000-8000-000000000101`,name:`餐饮`,parent_id:null,sort_order:10,type:`expense`},{children:[],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🛒`,id:`00000000-0000-4000-8000-000000000102`,name:`日常购物`,parent_id:null,sort_order:20,type:`expense`},{children:[{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`💴`,id:`00000000-0000-4000-8000-000000000106`,name:`固定工资`,parent_id:`00000000-0000-4000-8000-000000000105`,sort_order:10,type:`income`}],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`💰`,id:`00000000-0000-4000-8000-000000000105`,name:`工资`,parent_id:null,sort_order:10,type:`income`}],d={title:`Organisms/Categories/CategoryList`,component:a,decorators:[e=>(0,o.jsx)(r,{storageScope:`storybook-category-dialog`,children:(0,o.jsx)(e,{})})],args:{archiveCategoryAction:async()=>{},categories:u,onReorderError:()=>{},reorderCategoryAction:async()=>({}),updateCategoryAction:async()=>{}}},f={name:`分类管理列表`},p={name:`多行胶囊拖动排序`,args:{categories:[{...u[0],children:[`早餐`,`午餐`,`晚餐`,`咖啡`,`水果`,`零食`,`外食`,`其他餐饮`].map((e,t)=>({...u[0].children[0],id:`food-${t}`,name:e,sort_order:t}))},...u.slice(1)]},play:async({canvasElement:e})=>{let t=l(e);await c.click(t.getByRole(`button`,{name:`展开餐饮`}))}},m={name:`搜索小分类并自动展开`,play:async({canvasElement:e})=>{let t=l(e);await c.type(t.getByRole(`textbox`,{name:`搜索分类名称`}),`外食`),await s(t.getByText(`外食`)).toBeVisible(),await s(t.getByRole(`button`,{name:`收起餐饮`})).toBeDisabled(),await s(t.queryByText(`早餐`)).not.toBeInTheDocument(),await s(t.getByRole(`button`,{name:`收起餐饮`})).toBeVisible()}},h={name:`只读列表`,args:{canManageCategories:!1}},g={name:`空状态`,args:{categories:[]}},_={name:`拖动临时收起，松手恢复展开`,play:async({canvasElement:e})=>{let t=l(e);await c.click(t.getByRole(`button`,{name:`展开餐饮`})),await s(t.getByRole(`button`,{name:`调整外食排序`})).toBeEnabled()},parameters:{docs:{description:{story:`拖动大分类时临时收起全部小分类，松手或按 Escape 后恢复原展开状态。小分类仅在原大分类内排序；支持鼠标与触屏拖动。`}}}},v={name:`大分类全部折叠`,play:async({canvasElement:e})=>{let t=l(e);await s(t.getByRole(`button`,{name:`展开餐饮`})).toBeVisible(),await s(t.queryByText(`外食`)).not.toBeInTheDocument()}},y={name:`搜索无结果`,play:async({canvasElement:e})=>{let t=l(e);await c.type(t.getByRole(`textbox`,{name:`搜索分类名称`}),`不存在`),await s(t.getByText(`没有找到匹配的分类`)).toBeVisible()}},b={name:`清空搜索恢复折叠状态与拖动排序`,play:async({canvasElement:e})=>{let t=l(e),n=t.getByRole(`textbox`,{name:`搜索分类名称`});await c.type(n,`外食`),await s(t.getByRole(`button`,{name:`调整外食排序`})).toBeDisabled(),await s(t.getByRole(`button`,{name:`收起餐饮`})).toBeDisabled(),await c.clear(n),await s(t.getByRole(`button`,{name:`展开餐饮`})).toBeEnabled(),await s(t.getByRole(`button`,{name:`调整餐饮排序`})).toBeEnabled(),await s(t.queryByText(`外食`)).not.toBeInTheDocument()}},x={name:`弹窗等宽按钮与归档样式`,play:async({canvasElement:e})=>{await c.click(l(e).getByRole(`button`,{name:`编辑餐饮`}));let t=l(await l(e.ownerDocument.body).findByRole(`dialog`)),n=t.getByRole(`button`,{name:`取消`}),r=t.getByRole(`button`,{name:`保存`});await s(n.getBoundingClientRect().width).toBeCloseTo(r.getBoundingClientRect().width,0),await s(n.getBoundingClientRect().top).toBe(r.getBoundingClientRect().top),await s(t.getByRole(`button`,{name:`归档该分类`}).getBoundingClientRect().bottom).toBeLessThan(n.getBoundingClientRect().top)}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "分类管理列表"
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "多行胶囊拖动排序",
  args: {
    categories: [{
      ...categories[0],
      children: ["早餐", "午餐", "晚餐", "咖啡", "水果", "零食", "外食", "其他餐饮"].map((name, index) => ({
        ...categories[0].children[0],
        id: \`food-\${index}\`,
        name,
        sort_order: index
      }))
    }, ...categories.slice(1)]
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "展开餐饮"
    }));
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "搜索小分类并自动展开",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", {
      name: "搜索分类名称"
    }), "外食");
    await expect(canvas.getByText("外食")).toBeVisible();
    await expect(canvas.getByRole("button", {
      name: "收起餐饮"
    })).toBeDisabled();
    await expect(canvas.queryByText("早餐")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", {
      name: "收起餐饮"
    })).toBeVisible();
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "只读列表",
  args: {
    canManageCategories: false
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "空状态",
  args: {
    categories: []
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "拖动临时收起，松手恢复展开",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "展开餐饮"
    }));
    await expect(canvas.getByRole("button", {
      name: "调整外食排序"
    })).toBeEnabled();
  },
  parameters: {
    docs: {
      description: {
        story: "拖动大分类时临时收起全部小分类，松手或按 Escape 后恢复原展开状态。小分类仅在原大分类内排序；支持鼠标与触屏拖动。"
      }
    }
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "大分类全部折叠",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", {
      name: "展开餐饮"
    })).toBeVisible();
    await expect(canvas.queryByText("外食")).not.toBeInTheDocument();
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "搜索无结果",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", {
      name: "搜索分类名称"
    }), "不存在");
    await expect(canvas.getByText("没有找到匹配的分类")).toBeVisible();
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "清空搜索恢复折叠状态与拖动排序",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("textbox", {
      name: "搜索分类名称"
    });
    await userEvent.type(search, "外食");
    await expect(canvas.getByRole("button", {
      name: "调整外食排序"
    })).toBeDisabled();
    await expect(canvas.getByRole("button", {
      name: "收起餐饮"
    })).toBeDisabled();
    await userEvent.clear(search);
    await expect(canvas.getByRole("button", {
      name: "展开餐饮"
    })).toBeEnabled();
    await expect(canvas.getByRole("button", {
      name: "调整餐饮排序"
    })).toBeEnabled();
    await expect(canvas.queryByText("外食")).not.toBeInTheDocument();
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "弹窗等宽按钮与归档样式",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "编辑餐饮"
    }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    const cancel = dialog.getByRole("button", {
      name: "取消"
    });
    const submit = dialog.getByRole("button", {
      name: "保存"
    });
    await expect(cancel.getBoundingClientRect().width).toBeCloseTo(submit.getBoundingClientRect().width, 0);
    await expect(cancel.getBoundingClientRect().top).toBe(submit.getBoundingClientRect().top);
    const archive = dialog.getByRole("button", {
      name: "归档该分类"
    });
    await expect(archive.getBoundingClientRect().bottom).toBeLessThan(cancel.getBoundingClientRect().top);
  }
}`,...x.parameters?.docs?.source}}},S=[`Default`,`WrappingChips`,`ChildSearch`,`ReadOnly`,`Empty`,`DragSorting`,`Collapsed`,`NoSearchResults`,`SearchRestoresSorting`,`DialogButtons`]}))();export{m as ChildSearch,v as Collapsed,f as Default,x as DialogButtons,_ as DragSorting,g as Empty,y as NoSearchResults,h as ReadOnly,b as SearchRestoresSorting,p as WrappingChips,S as __namedExportsOrder,d as default};