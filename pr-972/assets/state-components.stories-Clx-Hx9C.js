import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-Blj2xom2.js";import{n as i,t as a}from"./Button-DJTTRrLP.js";import{n as o,t as s}from"./SectionCard-BVovW058.js";import{n as c,t as l}from"./EmptyState-B_TfD1wR.js";import{n as u,r as d,t as f}from"./ErrorState-CkLmTqrE.js";import{n as p,t as m}from"./LoadingState-fVgAMiYX.js";function h({children:e,sx:t,...r}){return(0,g.jsx)(n,{direction:{xs:`column`,sm:`row`},spacing:1.5,sx:[{justifyContent:`flex-end`,pt:1},...Array.isArray(t)?t:[t]],...r,children:e})}var g,_=e((()=>{g=t(),r(),h.__docgenInfo={description:``,methods:[],displayName:`FormActions`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``}}}})),v,y,b,x,S,C,w;e((()=>{v=t(),a(),r(),c(),d(),_(),p(),o(),y={title:`Molecules/UI/StateComponents`},b={name:`EmptyState`,render:()=>(0,v.jsx)(l,{title:`还没有账户`,description:`请先新增一个账户。`,action:(0,v.jsx)(i,{variant:`contained`,children:`新增账户`})})},x={name:`LoadingState`,render:()=>(0,v.jsx)(m,{title:`读取账户中`,description:`正在读取账户列表。`})},S={name:`ErrorState`,render:()=>(0,v.jsx)(u,{title:`账户操作失败`,description:`账户新增失败。请确认账户名称是否重复。`,action:(0,v.jsx)(f,{})})},C={name:`SectionCard + FormActions`,render:()=>(0,v.jsx)(s,{children:(0,v.jsxs)(n,{spacing:2,children:[(0,v.jsx)(`div`,{children:`表单内容区域`}),(0,v.jsxs)(h,{children:[(0,v.jsx)(i,{variant:`outlined`,children:`取消`}),(0,v.jsx)(i,{variant:`contained`,children:`保存`})]})]})})},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "EmptyState",
  render: () => <EmptyState title="还没有账户" description="请先新增一个账户。" action={<Button variant="contained">新增账户</Button>} />
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "LoadingState",
  render: () => <LoadingState title="读取账户中" description="正在读取账户列表。" />
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "ErrorState",
  render: () => <ErrorState title="账户操作失败" description="账户新增失败。请确认账户名称是否重复。" action={<ErrorRetryButton />} />
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "SectionCard + FormActions",
  render: () => <SectionCard>
      <Stack spacing={2}>
        <div>表单内容区域</div>
        <FormActions>
          <Button variant="outlined">取消</Button>
          <Button variant="contained">保存</Button>
        </FormActions>
      </Stack>
    </SectionCard>
}`,...C.parameters?.docs?.source}}},w=[`Empty`,`Loading`,`Error`,`CardAndActions`]}))();export{C as CardAndActions,b as Empty,S as Error,x as Loading,w as __namedExportsOrder,y as default};