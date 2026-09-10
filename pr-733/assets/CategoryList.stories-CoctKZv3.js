import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./UserThemeProvider-CvJ_H64d.js";import{n as i,t as a}from"./CategoryList-CO_DvP2P.js";var o,s,c,l,u,d,f,p,m,h,g,_;e((()=>{o=t(),n(),i(),{expect:s,userEvent:c,within:l}=__STORYBOOK_MODULE_TEST__,u={title:`Organisms/Categories/CategoryList`,component:a,decorators:[e=>(0,o.jsx)(r,{storageScope:`storybook-category-dialog`,children:(0,o.jsx)(e,{})})],args:{archiveCategoryAction:async()=>{},categories:[{children:[{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍞`,id:`00000000-0000-4000-8000-000000000103`,name:`早餐`,parent_id:`00000000-0000-4000-8000-000000000101`,sort_order:10,type:`expense`},{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍜`,id:`00000000-0000-4000-8000-000000000104`,name:`外食`,parent_id:`00000000-0000-4000-8000-000000000101`,sort_order:20,type:`expense`}],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🍽️`,id:`00000000-0000-4000-8000-000000000101`,name:`餐饮`,parent_id:null,sort_order:10,type:`expense`},{children:[],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`🛒`,id:`00000000-0000-4000-8000-000000000102`,name:`日常购物`,parent_id:null,sort_order:20,type:`expense`},{children:[{created_at:`2026-01-01T00:00:00.000Z`,icon_name:`💴`,id:`00000000-0000-4000-8000-000000000106`,name:`固定工资`,parent_id:`00000000-0000-4000-8000-000000000105`,sort_order:10,type:`income`}],created_at:`2026-01-01T00:00:00.000Z`,icon_name:`💰`,id:`00000000-0000-4000-8000-000000000105`,name:`工资`,parent_id:null,sort_order:10,type:`income`}],onReorderError:()=>{},reorderCategoryAction:async()=>({}),updateCategoryAction:async()=>{}}},d={name:`分类管理列表`},f={name:`搜索小分类并自动展开`,play:async({canvasElement:e})=>{let t=l(e);await c.click(t.getByRole(`button`,{name:`收起餐饮`})),await c.type(t.getByRole(`textbox`,{name:`搜索分类名称`}),`外食`),await s(t.getByText(`外食`)).toBeVisible(),await s(t.queryByText(`早餐`)).not.toBeInTheDocument(),await s(t.getByRole(`button`,{name:`收起餐饮`})).toBeVisible()}},p={name:`只读列表`,args:{canManageCategories:!1}},m={name:`空状态`,args:{categories:[]}},h={name:`拖动临时收起，松手恢复展开`,parameters:{docs:{description:{story:`拖动大分类时临时收起全部小分类，松手或按 Escape 后恢复原展开状态。小分类仅在原大分类内排序；支持触屏拖动与直接按上下方向键排序。`}}}},g={name:`弹窗等宽按钮与归档样式`,play:async({canvasElement:e})=>{await c.click(l(e).getByRole(`button`,{name:`编辑餐饮`}));let t=l(await l(e.ownerDocument.body).findByRole(`dialog`)),n=t.getByRole(`button`,{name:`取消`}),r=t.getByRole(`button`,{name:`保存`});await s(n.getBoundingClientRect().width).toBeCloseTo(r.getBoundingClientRect().width,0),await s(n.getBoundingClientRect().top).toBe(r.getBoundingClientRect().top),await s(t.getByRole(`button`,{name:`归档该分类`}).getBoundingClientRect().bottom).toBeLessThan(n.getBoundingClientRect().top)}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "分类管理列表"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "搜索小分类并自动展开",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: "收起餐饮"
    }));
    await userEvent.type(canvas.getByRole("textbox", {
      name: "搜索分类名称"
    }), "外食");
    await expect(canvas.getByText("外食")).toBeVisible();
    await expect(canvas.queryByText("早餐")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", {
      name: "收起餐饮"
    })).toBeVisible();
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "只读列表",
  args: {
    canManageCategories: false
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "空状态",
  args: {
    categories: []
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "拖动临时收起，松手恢复展开",
  parameters: {
    docs: {
      description: {
        story: "拖动大分类时临时收起全部小分类，松手或按 Escape 后恢复原展开状态。小分类仅在原大分类内排序；支持触屏拖动与直接按上下方向键排序。"
      }
    }
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_=[`Default`,`ChildSearch`,`ReadOnly`,`Empty`,`DragSorting`,`DialogButtons`]}))();export{f as ChildSearch,d as Default,g as DialogButtons,h as DragSorting,m as Empty,p as ReadOnly,_ as __namedExportsOrder,u as default};