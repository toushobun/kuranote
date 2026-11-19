import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Typography-B_0Lz4TE.js";import{g as i,h as a}from"./iframe-IXmXGk5H.js";import{n as o,t as s}from"./Stack-CedAN9w3.js";import{n as c,t as l}from"./AddRounded-BlkUoqAK.js";import{n as u,t as d}from"./ChevronRightRounded-Ci9Y-4eN.js";import{n as f,t as p}from"./actionPendingMessages-B03PK8BF.js";import{n as m,t as h}from"./ActionButton-DYhkfSHG.js";var g,_,v,y,b,x,S,C,w;e((()=>{g=t(),c(),u(),s(),r(),f(),i(),m(),_={borderRadius:`${a.radius.full}px`},v={title:`Atoms/UI/ActionButton`,component:h,args:{children:`保存`,pendingLabel:p.save,variant:`contained`,sx:_}},y={name:`主按钮`},b={name:`主按钮处理中`,args:{pending:!0}},x={name:`主按钮不可用`,args:{disabled:!0}},S={name:`主按钮 / 描边 / 危险 × 常态 / 处理中 / 不可用`,render:()=>(0,g.jsx)(o,{spacing:2,children:[{label:`主按钮`,variant:`contained`,color:`primary`},{label:`描边`,variant:`outlined`,color:`primary`},{label:`危险`,variant:`outlined`,color:`error`}].map(({label:e,variant:t,color:r})=>(0,g.jsxs)(o,{spacing:1,children:[(0,g.jsx)(n,{variant:`subtitle2`,children:e}),(0,g.jsxs)(o,{direction:`row`,spacing:1,children:[(0,g.jsx)(h,{variant:t,color:r,sx:_,pendingLabel:p.save,children:`保存`}),(0,g.jsx)(h,{variant:t,color:r,sx:_,pending:!0,pendingLabel:p.save,children:`保存`}),(0,g.jsx)(h,{variant:t,color:r,sx:_,disabled:!0,pendingLabel:p.save,children:`保存`})]})]},e))})},C={name:`左右图标 × 常态 / 处理中`,render:()=>(0,g.jsxs)(o,{spacing:2,children:[(0,g.jsxs)(o,{spacing:1,children:[(0,g.jsx)(n,{variant:`subtitle2`,children:`左侧图标`}),(0,g.jsxs)(o,{direction:`row`,spacing:1,children:[(0,g.jsx)(h,{startIcon:(0,g.jsx)(l,{}),pendingLabel:p.add,variant:`contained`,children:`添加别名`}),(0,g.jsx)(h,{startIcon:(0,g.jsx)(l,{}),pending:!0,pendingLabel:p.add,variant:`contained`,children:`添加别名`})]})]}),(0,g.jsxs)(o,{spacing:1,children:[(0,g.jsx)(n,{variant:`subtitle2`,children:`右侧图标`}),(0,g.jsxs)(o,{direction:`row`,spacing:1,children:[(0,g.jsx)(h,{endIcon:(0,g.jsx)(d,{}),pendingLabel:p.continue,variant:`outlined`,children:`继续创建`}),(0,g.jsx)(h,{endIcon:(0,g.jsx)(d,{}),pending:!0,pendingLabel:p.continue,variant:`outlined`,children:`继续创建`})]})]})]})},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "主按钮"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "主按钮处理中",
  args: {
    pending: true
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "主按钮不可用",
  args: {
    disabled: true
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "主按钮 / 描边 / 危险 × 常态 / 处理中 / 不可用",
  render: () => <Stack spacing={2}>
      {([{
      label: "主按钮",
      variant: "contained" as const,
      color: "primary" as const
    }, {
      label: "描边",
      variant: "outlined" as const,
      color: "primary" as const
    }, {
      label: "危险",
      variant: "outlined" as const,
      color: "error" as const
    }] as const).map(({
      label,
      variant,
      color
    }) => <Stack spacing={1} key={label}>
          <Typography variant="subtitle2">{label}</Typography>
          <Stack direction="row" spacing={1}>
            <ActionButton variant={variant} color={color} sx={pillSx} pendingLabel={actionPendingMessages.save}>
              保存
            </ActionButton>
            <ActionButton variant={variant} color={color} sx={pillSx} pending pendingLabel={actionPendingMessages.save}>
              保存
            </ActionButton>
            <ActionButton variant={variant} color={color} sx={pillSx} disabled pendingLabel={actionPendingMessages.save}>
              保存
            </ActionButton>
          </Stack>
        </Stack>)}
    </Stack>
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "左右图标 × 常态 / 处理中",
  render: () => <Stack spacing={2}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">左侧图标</Typography>
        <Stack direction="row" spacing={1}>
          <ActionButton startIcon={<AddRoundedIcon />} pendingLabel={actionPendingMessages.add} variant="contained">
            添加别名
          </ActionButton>
          <ActionButton startIcon={<AddRoundedIcon />} pending pendingLabel={actionPendingMessages.add} variant="contained">
            添加别名
          </ActionButton>
        </Stack>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle2">右侧图标</Typography>
        <Stack direction="row" spacing={1}>
          <ActionButton endIcon={<ChevronRightRoundedIcon />} pendingLabel={actionPendingMessages.continue} variant="outlined">
            继续创建
          </ActionButton>
          <ActionButton endIcon={<ChevronRightRoundedIcon />} pending pendingLabel={actionPendingMessages.continue} variant="outlined">
            继续创建
          </ActionButton>
        </Stack>
      </Stack>
    </Stack>
}`,...C.parameters?.docs?.source}}},w=[`Default`,`Pending`,`Disabled`,`Variants`,`WithIcons`]}))();export{y as Default,x as Disabled,b as Pending,S as Variants,C as WithIcons,w as __namedExportsOrder,v as default};