/* This module handles the tools to edit the scene and bridges WebGLStudio with PlayCanvas */

var EditorModule = { 
	name: "editor",
	icons_path:  "imgs/",

	// PlayCanvas Engine References
	pc_app: null,
	entities: {},

	// to call when editing a node
	node_editors: [],
	material_editors: {},

	selected_data: null, // the extra info about this item selected (which component, which field, etc)

	preferences_panel: [ {name:"editor", title:"Editor", icon:null } ],
	preferences: { // persistent preferences
		autoselect: false,
		autofocus: true,
		save_on_exit: false,
		reload_on_start: true
	},

	commands: {},
	canvas_widgets: {},

	init: function()
	{
		// 1. Initialize PlayCanvas using the existing RenderModule's canvas
		if(RenderModule.canvas_manager)
		{
			this.initPlayCanvas(RenderModule.canvas_manager);
			RenderModule.canvas_manager.addWidget(this);
		}

		if(!gl) 
			return;

		this.createMenuEntries();

		var scene = LS.GlobalScene;

		LEvent.bind( scene, "node_clicked", function(e, node) { 
			if( !window.PlayModule || !PlayModule.inplayer )
				EditorModule.inspect( node );
		});
		
		SelectionModule.setSelection( scene.root );

		var saved_scene = localStorage.getItem("_refresh_scene");
		if(saved_scene)
			setTimeout(function(){ 
				SceneStorageModule.setSceneFromJSON(saved_scene); 
				localStorage.removeItem("_refresh_scene");
			},1000);
		else
		{
			this.resetScene();
		}

		EditorModule.refreshAttributes();
		this.registerCommands();
	},

	// --- PLAYCANVAS CORE INTEGRATION ---
	initPlayCanvas: function(manager) {
		var canvas = manager.canvas;
		this.pc_app = new pc.Application(canvas, {
			mouse: new pc.Mouse(canvas),
			touch: new pc.TouchDevice(canvas),
			keyboard: new pc.Keyboard(window)
		});

		this.pc_app.start();
		this.pc_app.setCanvasFillMode(pc.FILLMODE_NONE);

		var root = this.pc_app.root;
		
		// Setup default Editor Camera and Lights for PC
		var camera = new pc.Entity("MainCamera");
		camera.addComponent("camera", { clearColor: new pc.Color(0.1, 0.1, 0.1, 1) });
		camera.setPosition(0, 2, 10);
		root.addChild(camera);

		var light = new pc.Entity("EditorLight");
		light.addComponent("light", { type: "directional" });
		light.setEulerAngles(45, 45, 0);
		root.addChild(light);

		// Launch Assets
		this.loadInitialAssets();
	},

	loadInitialAssets: function() {
		this.spawnEntity("Goku", "/assets/models/goku.glb", [0, 0, 0]);
		this.spawnEntity("SpiderMan", "/assets/models/spiderman.glb", [2, 0, 0]);
		this.spawnEntity("Rocks", "/assets/models/rocks.glb", [-2, -0.5, 0]);
	},

	spawnEntity: function(name, url, pos) {
		var entity = new pc.Entity(name);
		entity.setPosition(pos[0], pos[1], pos[2]);
		this.pc_app.assets.loadFromUrl(url, "container", (err, asset) => {
			if (!err) {
				entity.addComponent("model", { type: "asset", asset: asset.resource.model });
				this.pc_app.root.addChild(entity);
				this.entities[name] = entity;
			}
		});
		return entity;
	},

	resetScene: function()
	{
		// set default scene
		LS.GlobalScene.clear();
		LS.GlobalScene.root.addComponent( new LS.Components.Skybox() );
	},

	registerCommands: function()
	{
		this.commands["set"] = this.setPropertyValueToSelectedNode.bind(this);
		
		// AI Integration Command
		this.commands["pc_move"] = function(cmd, tokens) {
			var ent = EditorModule.entities[tokens[1]];
			if(ent) ent.translate(parseFloat(tokens[2] || 0), 0, 0);
		};

		this.commands["create"] = function( cmd, tokens )
		{
			var that = EditorModule;
			switch(tokens[1])
			{
				case "node": that.createNullNode(); break;
				case "light": that.createLightNode(); break;
				case "plane": that.createPrimitive({ geometry: LS.Components.GeometricPrimitive.PLANE, size: 10, subdivisions: 2 },"plane"); break;
				case "quad": that.createPrimitive({ geometry: LS.Components.GeometricPrimitive.QUAD, size: 10, subdivisions: 2 },"quad"); break;
				case "cube": that.createPrimitive({ geometry: LS.Components.GeometricPrimitive.CUBE, size: 10, subdivisions: 10 },"cube"); break;
				case "sphere": that.createPrimitive({ geometry: LS.Components.GeometricPrimitive.SPHERE, size: 10, subdivisions: 32 },"sphere"); break;
				case "cylinder": that.createPrimitive({ geometry: LS.Components.GeometricPrimitive.CYLINDER, size: 10, subdivisions: 32 },"cylinder"); break;
				default: break;
			}
		}
		this.commands["addComponent"] = function( cmd, tokens) { 
			EditorModule.addComponentToNode( SelectionModule.getSelectedNode(), tokens[1] );
			EditorModule.inspect( LS.GlobalScene.selected_node );
		};
		this.commands["selectNode"] = function( cmd, tokens) { 
			var node = LS.GlobalScene.getNode( tokens[1] );
			SelectionModule.setSelection( node );
		};
		this.commands["lights"] = function( cmd, tokens) { 
			var lights = LS.GlobalScene._lights;
			if(!lights) return;
			EditorModule.inspectObjects( lights );
		};
		this.commands["cameras"] = function( cmd, tokens) { 
			var cameras = RenderModule.cameras;
			if(!cameras) return;
			EditorModule.inspectObjects(cameras);
		};
		this.commands["components"] = function(cmd, tokens) { 
			var components = LS.GlobalScene.findNodeComponents( tokens[1] );
			if(!components || !components.length) return;
			EditorModule.inspectObjects( components );
		};
		this.commands["focus"] = function() {
			EditorModule.focusCameraInSelection();
		};
		this.commands["frame"] = function() {
			EditorModule.focusCameraInAll();
		};
		this.commands["upgrade_materials"] = function() {
			EditorModule.upgradeMaterials();
		};
	},

	registerCanvasWidget: function( widget_class )
	{
		this.canvas_widgets[ LS.getClassName( widget_class ) ] = widget_class;
	},

	createMenuEntries: function()
	{
		var mainmenu = LiteGUI.menubar;
		//buttons

		mainmenu.add("Scene/Settings", { callback: function() { 
			EditorModule.inspect( LS.GlobalScene ); 
		}});

		mainmenu.separator("Edit");

		mainmenu.add("Edit/Copy Node", { callback: function() { EditorModule.copyNodeToClipboard( SelectionModule.getSelectedNode() ); }});
		mainmenu.add("Edit/Paste Node", { callback: function() { EditorModule.pasteNodeFromClipboard(); }});
		mainmenu.add("Edit/Clone Node", { callback: function() { EditorModule.cloneNode( SelectionModule.getSelectedNode() ); }});
		mainmenu.add("Edit/Delete Node", { callback: function() { EditorModule.removeSelectedNodes(); }});
		mainmenu.add("Edit/Focus on node", { callback: function() { cameraTool.setFocusPointOnNode( SelectionModule.getSelectedNode(), true ); }});
		mainmenu.add("Edit/Paste component", { callback: function() { EditorModule.pasteComponentInNode( SelectionModule.getSelectedNode() ); }});

		mainmenu.add("Node/Create node", { callback: function() { EditorModule.createNullNode(); }});
		mainmenu.add("Node/Create camera", { callback: function() { EditorModule.createCameraNode(); }});
		mainmenu.add("Node/Create light", { callback: function() { EditorModule.createLightNode(); }} );
		
		mainmenu.add("Node/Primitive/Plane", { callback: function() { EditorModule.createPrimitive( { geometry: LS.Components.GeometricPrimitive.PLANE, size: 10, subdivisions: 10 }); }});
		mainmenu.add("Node/Primitive/Cube", { callback: function() { EditorModule.createPrimitive( { geometry: LS.Components.GeometricPrimitive.CUBE, size: 10, subdivisions: 10 }); }});
		mainmenu.add("Node/Primitive/Sphere", { callback: function() { EditorModule.createPrimitive( { geometry: LS.Components.GeometricPrimitive.SPHERE, size: 10, subdivisions: 32 }); }});
		mainmenu.add("Node/Primitive/Cylinder", { callback: function() { EditorModule.createPrimitive( { geometry: LS.Components.GeometricPrimitive.CYLINDER, size: 10, subdivisions: 32 }); }});
		
		mainmenu.add("Node/Add Component", { callback: function() { EditorModule.showAddComponentToNode(null, function(){ EditorModule.refreshAttributes(); } ); }} );
		mainmenu.add("Node/Add Material", { callback: function() { EditorModule.showAddMaterialToNode( null, function(){ EditorModule.refreshAttributes(); }); }} );
		mainmenu.add("Node/Add Script", { callback: function() { 
			CodingModule.onNewScript(); 
			EditorModule.refreshAttributes();
		}});
		mainmenu.add("Node/Create from JSON", { callback: function() { EditorModule.showCreateFromJSONDialog(); }} );
		mainmenu.add("Node/Check JSON", { callback: function() { EditorModule.checkJSON( SelectionModule.getSelectedNode() ); }} );

		mainmenu.add("View/Layers", { callback: function() { EditorModule.showLayersEditor(); }});

		mainmenu.add("Actions/Reload Shaders", { callback: function() { 
			LS.ShadersManager.reloadShaders(function() { RenderModule.requestFrame(); }); 
		}});

		function inner_change_renderMode(v) { RenderModule.setRenderMode(v.value); }
		function inner_is_renderMode(v) { 
			return (RenderModule.render_mode == v.value);
		}

		mainmenu.add("View/Show All Gizmos", {  instance: EditorModule.preferences, property: "render_all_gizmos", type:"checkbox" });

		mainmenu.add("View/Render Settings", { callback: function() { EditorModule.showRenderSettingsDialog( RenderModule.render_settings) }} );

		mainmenu.add("View/Render Mode/Wireframe", {  value: "wireframe", isChecked: inner_is_renderMode, callback: inner_change_renderMode });
		mainmenu.add("View/Render Mode/Flat", {  value: "flat", isChecked: inner_is_renderMode, callback: inner_change_renderMode });
		mainmenu.add("View/Render Mode/Solid", { value: "solid", isChecked: inner_is_renderMode, callback: inner_change_renderMode });
		mainmenu.add("View/Render Mode/Texture", { value: "texture", isChecked: inner_is_renderMode, callback: inner_change_renderMode });
		mainmenu.add("View/Render Mode/Full", { value: "full", isChecked: inner_is_renderMode, callback: inner_change_renderMode });
	},

	registerNodeEditor: function(callback)
	{
		this.node_editors.push(callback);
	},

	registerMaterialEditor: function(classname, callback)
	{
		this.material_editors[classname] = callback;
	},

	refreshAttributes: function()
	{
		if(!this.inspector || !this.inspector.instance)
			return;

		var instance = this.inspector.instance;

		//special case, refreshing with something that doesnt exist anymore (like when reloading a scene)
		if(instance.constructor === LS.SceneNode && instance.scene == null)
		{
			var new_node = LS.GlobalScene.getNodeByUId( instance.uid );
			if(new_node)
				this.inspector.instance = instance = new_node;
		}

		this.inspect(instance);
	},

	updateInspector: function( object )
	{
		this.inspector.update( object );
	},

	inspect: function( objects, inspector )
	{
		if(inspector)
		{
			if(inspector.constructor === InspectorWidget)
				return inspector.inspect( objects );
			if(inspector.inspector_widget)
				return inspector.inspector_widget.inspect( objects );
		}
		else if(this.inspector)
			return this.inspector.inspect( objects );
	},

	inspectObjects: function( objects, inspector )
	{
		return this.inspect( objects, inspector );
	},

	inspectInDialog: function( object )
	{
		if(!object)
			return;

		var classname = LS.getObjectClassName(object);
		var title = classname;

		var uid = object.uid || object.name;
		var id = "dialog_inspector_" + uid;
		
		var height = (InterfaceModule.visorarea.root.offsetHeight * 0.8)|0;

		var dialog = new LiteGUI.Dialog( { id: id, title: title, close: true, minimize: true, width: 300, height: height, detachable:true, scroll: true, resizable:true, draggable: true});
		dialog.show('fade');
		dialog.setPosition(50 + (Math.random() * 10)|0,50 + (Math.random() * 10)|0);

		var inspector_widget = new InspectorWidget();
		var inspector = inspector_widget.inspector;
		inspector_widget.inspector.on_refresh = function()
		{
			inspector_widget.inspect( object );
		}

		inspector_widget.inspector.refresh();
		dialog.add( inspector_widget );
		return dialog;
	},

	getInspectedInstance: function()
	{
		return this.inspector.instance;
	},

	checkCode: function( code, tabtitle )
	{
		if(!code)
			return;
		tabtitle = tabtitle || "Code";
		code = LiteGUI.htmlEncode( code ); 
		var w = window.open("",'_blank');
		w.document.write("<style>* { margin: 0; padding: 0; } html,body { margin: 20px; background-color: #222; color: #ddd; } </style>");
		w.document.write("<pre>"+code+"</pre>");
		w.document.close();
		w.document.title = tabtitle;
		return w;
	},

	checkJSON: function( object )
	{
		if(!object)
			return;
		if(object.constructor === String)
			object = JSON.parse(object);
		var data = JSON.stringify( object.serialize ? object.serialize() : object, null, '\t');
		return this.checkCode(data);
	},

	showAddPropertyDialog: function( callback, valid_fields )
	{
		valid_fields = valid_fields || ["string","number","vec2","vec3","vec4","color","texture","node"];
		var id = "dialog_inspector_properties";
		var dialog = new LiteGUI.Dialog( { id: id, title: "Properties", parent:"#visor", close: true, minimize: true, width: 300, height: 200, scroll: true, resizable:true, draggable: true});
		dialog.show('fade');

		var property = { name: "myVar", type: "number", value: 0, step: 0.1 };
		var inspector = new LiteGUI.Inspector();
		inspector.on_refresh = inner_refresh;
		inner_refresh();

		function inner_refresh()
		{
			inspector.clear();
			inspector.addString("Name", property.name, { callback: function(v){ property.name = v; } });
			inspector.addCombo("Type", property.type, { values: valid_fields, callback: function(v){ 
				property.type = v;
				inspector.refresh();
			}});

			inspector.addButton(null,"Create",{ callback: function() {
				if(callback) callback(property);
				dialog.close();
			}});
		}
		dialog.add( inspector );
	},

	isValidVarName: function() {
		var validName = /^[$A-Z_][0-9A-Z_$]*$/i;
		var reserved_array = ["var","return","function","if","else","for","while"];
		var reserved = {}
		for(var i in reserved_array) reserved[ reserved_array[i] ] = true;
		return function(s) {
			return validName.test(s) && !reserved[s];
		};
	}(),

	showNodeInfo: function( node )
	{
		var dialog = new LiteGUI.Dialog({ id: "node_info", title:"Node Info", width: 500, draggable: true, closable: true });
		var widgets = new LiteGUI.Inspector();
		widgets.addString("Name", node.name, function(v){ node.name = v; });
		widgets.addString("UID", node.uid, function(v){ node.uid = v; });
		widgets.addCheckbox("Visible", node.visible, function(v){ node.flags.visible = v; });
		widgets.addSeparator();
		widgets.addButtons(null,["Show JSON","Close"], function(v){
			if(v == "Show JSON") EditorModule.checkJSON( node );
			else dialog.close();
		});
		dialog.add( widgets );
		dialog.show();
	},

	showLayersEditor: function( layers, callback, node )
	{
		var scene = LS.GlobalScene;
		var dialog = new LiteGUI.Dialog({ id: "layers_editor", title:"Layers editor", width: 300, height: 500, draggable: true, closable: true });
		var widgets = new LiteGUI.Inspector();
		var container = widgets.startContainer();
		container.style.height = "300px";
		container.style.overflow = "auto";

		for(var i = 0; i < 32; ++i) {
			widgets.addString(null, scene.layer_names[i] || ("layer"+i), { layer: i, callback: function(v) {
				scene.layer_names[ this.options.layer ] = v;
			}});
		}
		widgets.endContainer();
		widgets.addButton(null,"Close", { callback: function(){ dialog.close(); }});
		dialog.add( widgets );
		dialog.show();
	},

	showComponentInfo: function( component )
	{
		var dialog = new LiteGUI.Dialog({ id: "component_info", title:"Component Info", width: 500, draggable: true, closable: true });
		var widgets = new LiteGUI.Inspector({name_width: 120});
		widgets.addString("Class", LS.getObjectClassName(component), { disabled: true } );
		widgets.addString("UID", component.uid, function(v){ component.uid = v; });
		widgets.addButtons(null,["Show JSON","Close"], function(v){
			if(v == "Show JSON") EditorModule.checkJSON( component );
			else dialog.close();
		});
		dialog.add( widgets );
		dialog.show();
	},

	showRenderSettingsDialog: function( render_settings )
	{
		var dialog = new LiteGUI.Dialog( { title:"Render Settings", width: 400, draggable: true, closable: true });
		var inspector = new LiteGUI.Inspector( {name_width:"50%"});
		inspector.on_refresh = function() {
			inspector.showObjectFields( render_settings );
		}
		inspector.refresh();
		dialog.add( inspector );
		dialog.show();
	},

	onDropOnNode: function( node, event )
	{
		if(!node) return;
		var item_uid = event.dataTransfer.getData("uid");
		var item_type = event.dataTransfer.getData("type");
		console.log("Dropped " + item_type + " on " + node.name);
		// Logic for handling drops...
		return true;
	},

	// Bridge Render function to allow PC to draw while keeping the Module registered
	render: function(gl) {
		return false; // Let PC take the lead on rendering the viewport
	}
};

CORE.registerModule( EditorModule );
