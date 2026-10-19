# Render six camera shots and a 240-frame orbit of a GLB in headless Blender:
#   Blender -b -P render_glb.py -- model.glb outdir     (STILLS=1 skips the orbit)
import bpy, sys, math, mathutils, os
glb, outdir = sys.argv[sys.argv.index('--')+1:][:2]
os.makedirs(outdir, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
pts=[o.matrix_world@mathutils.Vector(c) for o in objs for c in o.bound_box]
lo=mathutils.Vector([min(p[i] for p in pts) for i in range(3)]); hi=mathutils.Vector([max(p[i] for p in pts) for i in range(3)])
ctr=(lo+hi)/2; size=hi-lo; r=size.length/2
sc=bpy.context.scene
sc.render.engine=sc.render.engine  # keep default (EEVEE)
for e in ('BLENDER_EEVEE_NEXT','BLENDER_EEVEE'):
    try: sc.render.engine=e; break
    except TypeError: pass
sc.render.resolution_x,sc.render.resolution_y=1280,720
sc.render.image_settings.file_format='PNG'
try: sc.view_settings.view_transform='AgX'
except TypeError: pass
w=bpy.data.worlds.new('w'); sc.world=w; w.use_nodes=True
next(n for n in w.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.018,.02,.028,1)
# floor
bpy.ops.mesh.primitive_circle_add(vertices=96,radius=r*40,fill_type='NGON',location=(ctr.x,ctr.y,lo.z))
fl=bpy.context.object; m=bpy.data.materials.new('floor'); m.use_nodes=True
b=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
b.inputs['Base Color'].default_value=(.006,.007,.01,1); b.inputs['Roughness'].default_value=.55
fl.data.materials.append(m); bpy.data.objects.remove(fl)
def light(name,loc,energy,sz):
    d=bpy.data.lights.new(name,'AREA'); d.energy=energy; d.size=sz
    o=bpy.data.objects.new(name,d); sc.collection.objects.link(o); o.location=ctr+mathutils.Vector(loc)*r
    o.rotation_euler=(ctr-o.location).to_track_quat('-Z','Y').to_euler()
light('key',(2,-2,2.2),700*r*r,2*r); light('fill',(-2.5,-1.2,.8),160*r*r,3*r); light('rim',(-.5,3,2.2),550*r*r,2*r)
cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera=cam
def place(az, el, fill=1.0, lens=50, aim=None):
    cam.data.lens=lens
    aim=aim or ctr
    # fit bounding box: half-height and half-width against vertical/horizontal fov
    fy=cam.data.sensor_width*9/16; ay=2*math.atan(fy/2/lens); ax=2*math.atan(cam.data.sensor_width/2/lens)
    hw=max(size.x,size.y)/2; hh=size.z/2
    d=max(hh/math.tan(ay/2), hw/math.tan(ax/2))*1.14/fill + hw*.6
    a=math.radians(az); e=math.radians(el)
    cam.location=aim+mathutils.Vector((math.sin(a)*math.cos(e)*d,-math.cos(a)*math.cos(e)*d,math.sin(e)*d))
    cam.rotation_euler=(aim-cam.location).to_track_quat('-Z','Y').to_euler()
shots={'hero':(-35,12,1,50,None),'front':(0,4,1,50,None),'profile':(90,4,1,50,None),'back':(160,15,1,50,None),
       'low':(-20,1,1.25,35,mathutils.Vector((ctr.x,ctr.y,lo.z+size.z*.45))),'detail':(-25,8,2.2,85,mathutils.Vector((ctr.x,ctr.y,lo.z+size.z*.6)))}
for k,v in shots.items():
    place(*v); sc.render.filepath=f'{outdir}/{k}.png'; bpy.ops.render.render(write_still=True)
# orbit
N=0 if os.environ.get('STILLS') else int(os.environ.get('FRAMES','240')); sc.frame_start=1; sc.frame_end=N
for f in range(N):
    t=f/N; place(-35+360*t, 12+6*math.sin(2*math.pi*t)); cam.keyframe_insert('location',frame=f+1); cam.keyframe_insert('rotation_euler',frame=f+1)
if N: sc.render.filepath=f'{outdir}/orbit/f'; bpy.ops.render.render(animation=True)
print('DONE',outdir)
