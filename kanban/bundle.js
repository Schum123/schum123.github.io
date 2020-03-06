
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_binding_callback(fn) {
        binding_callbacks.push(fn);
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.callbacks.push(() => {
                outroing.delete(block);
                if (callback) {
                    block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    var fakeData = {
      results: [
        {
          gender: "male",
          name: {
            first: "rolf",
            last: "hegdal"
          },
          location: {
            street: "ljan terrasse 346",
            city: "vear",
            state: "rogaland",
            postcode: "3095"
          },
          age: "28",
          email: "rolf.hegdal@example.com",
          phone: "66976498",
          picture: {
            large: "https://randomuser.me/api/portraits/men/65.jpg",
            medium: "https://randomuser.me/api/portraits/med/men/65.jpg",
            thumbnail: "https://randomuser.me/api/portraits/thumb/men/65.jpg"
          },
          status: "1"
        },
        {
          gender: "male",
          name: {
            first: "Colleen",
            last: "Reyes"
          },
          location: {
            street: "ljan terrasse 346",
            city: "vear",
            state: "rogaland",
            postcode: "3095"
          },
          age: "38",
          email: "colleen.reyes16@example.com",
          phone: "66976498",
          picture: {
            large: "https://randomuser.me/api/portraits/women/23.jpg",
            medium: "https://randomuser.me/api/portraits/med/women/23.jpg",
            thumbnail: "https://randomuser.me/api/portraits/thumb/women/23.jpg"
          },
          status: "2"
        },
        {
          gender: "female",
          name: { title: "miss", first: "ariel", last: "østerbø" },
          location: {
            street: "holmsåsen 3548",
            city: "fetsund",
            state: "oppland",
            postcode: "7011"
          },
          age: "22",
          email: "ariel.østerbø@example.com",
          phone: "89525269",
          cell: "97608676",
          id: { name: "FN", value: "06085419364" },
          picture: {
            large: "https://randomuser.me/api/portraits/women/39.jpg",
            medium: "https://randomuser.me/api/portraits/med/women/39.jpg",
            thumbnail: "https://randomuser.me/api/portraits/thumb/women/39.jpg"
          },
          status: "3"
        },
        {
          gender: "female",
          name: { title: "miss", first: "ruby", last: "thomas" },
          location: {
            street: "5036 queen street",
            city: "greymouth",
            state: "gisborne",
            postcode: 31609
          },
          age: "49",
          email: "ruby.thomas@example.com",
          phone: "(020)-665-3311",
          cell: "(409)-597-3979",
          id: { name: "", value: null },
          picture: {
            large: "https://randomuser.me/api/portraits/women/95.jpg",
            medium: "https://randomuser.me/api/portraits/med/women/95.jpg",
            thumbnail: "https://randomuser.me/api/portraits/thumb/women/95.jpg"
          },
          status: "4"
        },
        {
          gender: "male",
          name: { title: "mr", first: "gerry", last: "bennett" },
          location: {
            street: "1090 manor road",
            city: "midleton",
            state: "cork city",
            postcode: 30161
          },
          age: "79",
          email: "gerry.bennett@example.com",
          phone: "071-105-6681",
          cell: "081-204-8704",
          id: { name: "PPS", value: "2748874T" },
          picture: {
            large: "https://randomuser.me/api/portraits/men/24.jpg",
            medium: "https://randomuser.me/api/portraits/med/men/24.jpg",
            thumbnail: "https://randomuser.me/api/portraits/thumb/men/24.jpg"
          },
          status: "5"
        },
        {
          gender: "male",
          name: { title: "mr", first: "villads", last: "petersen" },
          location: {
            street: "5517 toftevænget",
            city: "assens",
            state: "danmark",
            postcode: 55957
          },
          age: "33",
          email: "villads.petersen@example.com",
          phone: "35616868",
          cell: "01199635",
          id: { name: "CPR", value: "516513-9119" },
          picture: {
            large: "https://randomuser.me/api/portraits/men/17.jpg",
            medium: "https://randomuser.me/api/portraits/med/men/17.jpg",
            thumbnail: "https://randomuser.me/api/portraits/thumb/men/17.jpg"
          },
          status: "3"
        }
      ]
    };

    /* src\Atoms\Heading\index.svelte generated by Svelte v3.6.1 */

    const file = "src\\Atoms\\Heading\\index.svelte";

    function create_fragment(ctx) {
    	var h3, t;

    	return {
    		c: function create() {
    			h3 = element("h3");
    			t = text(ctx.text);
    			attr(h3, "class", "svelte-1y4xzr");
    			add_location(h3, file, 4, 0, 43);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h3, anchor);
    			append(h3, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.text) {
    				set_data(t, ctx.text);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h3);
    			}
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { text } = $$props;

    	const writable_props = ['text'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    	};

    	return { text };
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["text"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.text === undefined && !('text' in props)) {
    			console.warn("<Index> was created without expected prop 'text'");
    		}
    	}

    	get text() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Molecules\ColumnHeader\index.svelte generated by Svelte v3.6.1 */

    const file$1 = "src\\Molecules\\ColumnHeader\\index.svelte";

    function create_fragment$1(ctx) {
    	var div, current;

    	var text_1 = new Index({
    		props: { text: ctx.text },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			text_1.$$.fragment.c();
    			attr(div, "aria-label", "Test column heading");
    			attr(div, "class", "board__column--header svelte-q6ulws");
    			add_location(div, file$1, 4, 0, 96);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(text_1, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var text_1_changes = {};
    			if (changed.text) text_1_changes.text = ctx.text;
    			text_1.$set(text_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(text_1, );
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { text } = $$props;

    	const writable_props = ['text'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    	};

    	return { text };
    }

    class Index$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["text"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.text === undefined && !('text' in props)) {
    			console.warn("<Index> was created without expected prop 'text'");
    		}
    	}

    	get text() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Atoms\Button\index.svelte generated by Svelte v3.6.1 */

    const file$2 = "src\\Atoms\\Button\\index.svelte";

    function create_fragment$2(ctx) {
    	var button, t, dispose;

    	return {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.text);
    			attr(button, "class", "svelte-ktdxoq");
    			add_location(button, file$2, 4, 0, 43);
    			dispose = listen(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.text) {
    				set_data(t, ctx.text);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { text } = $$props;

    	const writable_props = ['text'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    	};

    	return { text, click_handler };
    }

    class Index$2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["text"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.text === undefined && !('text' in props)) {
    			console.warn("<Index> was created without expected prop 'text'");
    		}
    	}

    	get text() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Organisms\Column\index.svelte generated by Svelte v3.6.1 */

    const file$3 = "src\\Organisms\\Column\\index.svelte";

    function create_fragment$3(ctx) {
    	var li, t0, ul, t1, current;

    	var columnheader = new Index$1({
    		props: { text: ctx.text },
    		$$inline: true
    	});

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	var adduser = new Index$2({
    		props: { text: "Lägg till" },
    		$$inline: true
    	});
    	adduser.$on("click", ctx.click_handler);

    	return {
    		c: function create() {
    			li = element("li");
    			columnheader.$$.fragment.c();
    			t0 = space();
    			ul = element("ul");

    			if (default_slot) default_slot.c();
    			t1 = space();
    			adduser.$$.fragment.c();

    			attr(ul, "id", ctx.accessor);
    			attr(ul, "class", "svelte-rdr97m");
    			add_location(ul, file$3, 10, 4, 263);
    			attr(li, "class", "board__column");
    			add_location(li, file$3, 8, 0, 198);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(ul_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			mount_component(columnheader, li, null);
    			append(li, t0);
    			append(li, ul);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			append(li, t1);
    			mount_component(adduser, li, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var columnheader_changes = {};
    			if (changed.text) columnheader_changes.text = ctx.text;
    			columnheader.$set(columnheader_changes);

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (!current || changed.accessor) {
    				attr(ul, "id", ctx.accessor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(columnheader.$$.fragment, local);

    			transition_in(default_slot, local);

    			transition_in(adduser.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(columnheader.$$.fragment, local);
    			transition_out(default_slot, local);
    			transition_out(adduser.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}

    			destroy_component(columnheader, );

    			if (default_slot) default_slot.d(detaching);

    			destroy_component(adduser, );
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

      let { text, accessor } = $$props;

    	const writable_props = ['text', 'accessor'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    		if ('accessor' in $$props) $$invalidate('accessor', accessor = $$props.accessor);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		text,
    		accessor,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Index$3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["text", "accessor"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.text === undefined && !('text' in props)) {
    			console.warn("<Index> was created without expected prop 'text'");
    		}
    		if (ctx.accessor === undefined && !('accessor' in props)) {
    			console.warn("<Index> was created without expected prop 'accessor'");
    		}
    	}

    	get text() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get accessor() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set accessor(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Organisms\Modal\index.svelte generated by Svelte v3.6.1 */

    const file$4 = "src\\Organisms\\Modal\\index.svelte";

    const get_header_slot_changes = ({}) => ({});
    const get_header_slot_context = ({}) => ({});

    function create_fragment$4(ctx) {
    	var div0, t0, div1, t1, current, dispose;

    	const header_slot_1 = ctx.$$slots.header;
    	const header_slot = create_slot(header_slot_1, ctx, get_header_slot_context);

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");

    			if (header_slot) header_slot.c();
    			t1 = space();

    			if (default_slot) default_slot.c();
    			attr(div0, "class", "modal-background svelte-my42ha");
    			add_location(div0, file$4, 32, 0, 534);

    			attr(div1, "class", "modal svelte-my42ha");
    			add_location(div1, file$4, 34, 0, 611);
    			dispose = listen(div0, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (header_slot) header_slot.l(div1_nodes);

    			if (default_slot) default_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			insert(target, t0, anchor);
    			insert(target, div1, anchor);

    			if (header_slot) {
    				header_slot.m(div1, null);
    			}

    			append(div1, t1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (header_slot && header_slot.p && changed.$$scope) {
    				header_slot.p(get_slot_changes(header_slot_1, ctx, changed, get_header_slot_changes), get_slot_context(header_slot_1, ctx, get_header_slot_context));
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    				detach(t0);
    				detach(div1);
    			}

    			if (header_slot) header_slot.d(detaching);

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler() {
    		return dispatch("close");
    	}

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		dispatch,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Index$4 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* src\Molecules\ProfileCard\index.svelte generated by Svelte v3.6.1 */

    const file$5 = "src\\Molecules\\ProfileCard\\index.svelte";

    function create_fragment$5(ctx) {
    	var div4, img, t0, h3, t1, t2, div3, div0, label0, t4, span0, t5, t6, div1, label1, t8, span1, t9, t10, div2, label2, t12, span2, t13;

    	return {
    		c: function create() {
    			div4 = element("div");
    			img = element("img");
    			t0 = space();
    			h3 = element("h3");
    			t1 = text(ctx.name);
    			t2 = space();
    			div3 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Ålder";
    			t4 = space();
    			span0 = element("span");
    			t5 = text(ctx.age);
    			t6 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Email";
    			t8 = space();
    			span1 = element("span");
    			t9 = text(ctx.email);
    			t10 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Adress";
    			t12 = space();
    			span2 = element("span");
    			t13 = text(ctx.address);
    			attr(img, "src", ctx.imgSrc);
    			attr(img, "class", "img img-responsive svelte-1s59jsn");
    			add_location(img, file$5, 9, 2, 150);
    			attr(h3, "class", "name svelte-1s59jsn");
    			add_location(h3, file$5, 10, 2, 203);
    			attr(label0, "class", "svelte-1s59jsn");
    			add_location(label0, file$5, 13, 6, 285);
    			attr(span0, "class", "svelte-1s59jsn");
    			add_location(span0, file$5, 14, 6, 313);
    			attr(div0, "class", "info svelte-1s59jsn");
    			add_location(div0, file$5, 12, 4, 259);
    			attr(label1, "class", "svelte-1s59jsn");
    			add_location(label1, file$5, 17, 6, 375);
    			attr(span1, "class", "svelte-1s59jsn");
    			add_location(span1, file$5, 18, 6, 403);
    			attr(div1, "class", "info svelte-1s59jsn");
    			add_location(div1, file$5, 16, 4, 349);
    			attr(label2, "class", "svelte-1s59jsn");
    			add_location(label2, file$5, 21, 6, 467);
    			attr(span2, "class", "svelte-1s59jsn");
    			add_location(span2, file$5, 22, 6, 496);
    			attr(div2, "class", "info svelte-1s59jsn");
    			add_location(div2, file$5, 20, 4, 441);
    			attr(div3, "class", "wrap svelte-1s59jsn");
    			add_location(div3, file$5, 11, 2, 235);
    			attr(div4, "class", "card svelte-1s59jsn");
    			add_location(div4, file$5, 8, 0, 128);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, img);
    			append(div4, t0);
    			append(div4, h3);
    			append(h3, t1);
    			append(div4, t2);
    			append(div4, div3);
    			append(div3, div0);
    			append(div0, label0);
    			append(div0, t4);
    			append(div0, span0);
    			append(span0, t5);
    			append(div3, t6);
    			append(div3, div1);
    			append(div1, label1);
    			append(div1, t8);
    			append(div1, span1);
    			append(span1, t9);
    			append(div3, t10);
    			append(div3, div2);
    			append(div2, label2);
    			append(div2, t12);
    			append(div2, span2);
    			append(span2, t13);
    		},

    		p: function update(changed, ctx) {
    			if (changed.imgSrc) {
    				attr(img, "src", ctx.imgSrc);
    			}

    			if (changed.name) {
    				set_data(t1, ctx.name);
    			}

    			if (changed.age) {
    				set_data(t5, ctx.age);
    			}

    			if (changed.email) {
    				set_data(t9, ctx.email);
    			}

    			if (changed.address) {
    				set_data(t13, ctx.address);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div4);
    			}
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { name, imgSrc, age, email, address } = $$props;

    	const writable_props = ['name', 'imgSrc', 'age', 'email', 'address'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('imgSrc' in $$props) $$invalidate('imgSrc', imgSrc = $$props.imgSrc);
    		if ('age' in $$props) $$invalidate('age', age = $$props.age);
    		if ('email' in $$props) $$invalidate('email', email = $$props.email);
    		if ('address' in $$props) $$invalidate('address', address = $$props.address);
    	};

    	return { name, imgSrc, age, email, address };
    }

    class Index$5 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["name", "imgSrc", "age", "email", "address"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<Index> was created without expected prop 'name'");
    		}
    		if (ctx.imgSrc === undefined && !('imgSrc' in props)) {
    			console.warn("<Index> was created without expected prop 'imgSrc'");
    		}
    		if (ctx.age === undefined && !('age' in props)) {
    			console.warn("<Index> was created without expected prop 'age'");
    		}
    		if (ctx.email === undefined && !('email' in props)) {
    			console.warn("<Index> was created without expected prop 'email'");
    		}
    		if (ctx.address === undefined && !('address' in props)) {
    			console.warn("<Index> was created without expected prop 'address'");
    		}
    	}

    	get name() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imgSrc() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgSrc(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get age() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set age(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get email() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set email(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get address() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set address(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Molecules\ColumnItem\index.svelte generated by Svelte v3.6.1 */

    const file$6 = "src\\Molecules\\ColumnItem\\index.svelte";

    // (34:0) {#if showModalInfoUser}
    function create_if_block(ctx) {
    	var current;

    	var modal = new Index$4({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.close_handler);

    	return {
    		c: function create() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var modal_changes = {};
    			if (changed.$$scope || changed.fullName || changed.imgSrc || changed.age || changed.email || changed.address) modal_changes.$$scope = { changed, ctx };
    			modal.$set(modal_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (35:1) <Modal on:close="{() => showModalInfoUser = false}">
    function create_default_slot(ctx) {
    	var current;

    	var card = new Index$5({
    		props: {
    		name: ctx.fullName,
    		imgSrc: ctx.imgSrc,
    		age: ctx.age,
    		email: ctx.email,
    		address: ctx.address
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			card.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var card_changes = {};
    			if (changed.fullName) card_changes.name = ctx.fullName;
    			if (changed.imgSrc) card_changes.imgSrc = ctx.imgSrc;
    			if (changed.age) card_changes.age = ctx.age;
    			if (changed.email) card_changes.email = ctx.email;
    			if (changed.address) card_changes.address = ctx.address;
    			card.$set(card_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	var li1, div, t0, ul, li0, span0, t2, span1, t4, span2, t6, h4, t7, t8, if_block_anchor, current, dispose;

    	var if_block = (ctx.showModalInfoUser) && create_if_block(ctx);

    	return {
    		c: function create() {
    			li1 = element("li");
    			div = element("div");
    			t0 = space();
    			ul = element("ul");
    			li0 = element("li");
    			span0 = element("span");
    			span0.textContent = "Visa mer";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Editera";
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "Ta bort";
    			t6 = space();
    			h4 = element("h4");
    			t7 = text(ctx.fullName);
    			t8 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr(div, "class", "more svelte-vc722c");
    			add_location(div, file$6, 22, 2, 484);
    			attr(span0, "class", "svelte-vc722c");
    			add_location(span0, file$6, 25, 6, 589);
    			attr(span1, "class", "svelte-vc722c");
    			add_location(span1, file$6, 26, 6, 638);
    			set_style(span2, "color", "rgb(255, 109, 109)");
    			attr(span2, "class", "svelte-vc722c");
    			add_location(span2, file$6, 27, 6, 666);
    			attr(li0, "class", "svelte-vc722c");
    			add_location(li0, file$6, 24, 4, 577);
    			attr(ul, "class", "menu svelte-vc722c");
    			toggle_class(ul, "active", ctx.showMenu);
    			add_location(ul, file$6, 23, 2, 528);
    			attr(h4, "class", "svelte-vc722c");
    			add_location(h4, file$6, 30, 2, 754);
    			attr(li1, "class", "drag-item svelte-vc722c");
    			add_location(li1, file$6, 21, 0, 458);

    			dispose = [
    				listen(div, "click", ctx.Toggle),
    				listen(span0, "click", ctx.moreInfo),
    				listen(span2, "click", ctx.click_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, li1, anchor);
    			append(li1, div);
    			append(li1, t0);
    			append(li1, ul);
    			append(ul, li0);
    			append(li0, span0);
    			append(li0, t2);
    			append(li0, span1);
    			append(li0, t4);
    			append(li0, span2);
    			append(li1, t6);
    			append(li1, h4);
    			append(h4, t7);
    			insert(target, t8, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.showMenu) {
    				toggle_class(ul, "active", ctx.showMenu);
    			}

    			if (!current || changed.fullName) {
    				set_data(t7, ctx.fullName);
    			}

    			if (ctx.showModalInfoUser) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li1);
    				detach(t8);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	

      let { fullName = "", imgSrc, age, email, address, showModalInfoUser = false } = $$props;
      let showMenu = false;

      function Toggle(){
        $$invalidate('showMenu', showMenu = !showMenu);
      }
      function moreInfo() {
        $$invalidate('showModalInfoUser', showModalInfoUser = true);
        $$invalidate('showMenu', showMenu = false);
      }

    	const writable_props = ['fullName', 'imgSrc', 'age', 'email', 'address', 'showModalInfoUser'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function close_handler() {
    		const $$result = showModalInfoUser = false;
    		$$invalidate('showModalInfoUser', showModalInfoUser);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('fullName' in $$props) $$invalidate('fullName', fullName = $$props.fullName);
    		if ('imgSrc' in $$props) $$invalidate('imgSrc', imgSrc = $$props.imgSrc);
    		if ('age' in $$props) $$invalidate('age', age = $$props.age);
    		if ('email' in $$props) $$invalidate('email', email = $$props.email);
    		if ('address' in $$props) $$invalidate('address', address = $$props.address);
    		if ('showModalInfoUser' in $$props) $$invalidate('showModalInfoUser', showModalInfoUser = $$props.showModalInfoUser);
    	};

    	return {
    		fullName,
    		imgSrc,
    		age,
    		email,
    		address,
    		showModalInfoUser,
    		showMenu,
    		Toggle,
    		moreInfo,
    		click_handler,
    		close_handler
    	};
    }

    class Index$6 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["fullName", "imgSrc", "age", "email", "address", "showModalInfoUser"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.imgSrc === undefined && !('imgSrc' in props)) {
    			console.warn("<Index> was created without expected prop 'imgSrc'");
    		}
    		if (ctx.age === undefined && !('age' in props)) {
    			console.warn("<Index> was created without expected prop 'age'");
    		}
    		if (ctx.email === undefined && !('email' in props)) {
    			console.warn("<Index> was created without expected prop 'email'");
    		}
    		if (ctx.address === undefined && !('address' in props)) {
    			console.warn("<Index> was created without expected prop 'address'");
    		}
    	}

    	get fullName() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fullName(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imgSrc() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgSrc(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get age() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set age(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get email() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set email(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get address() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set address(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showModalInfoUser() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showModalInfoUser(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Atoms\Input\index.svelte generated by Svelte v3.6.1 */

    const file$7 = "src\\Atoms\\Input\\index.svelte";

    function create_fragment$7(ctx) {
    	var input, dispose;

    	return {
    		c: function create() {
    			input = element("input");
    			attr(input, "id", ctx.id);
    			attr(input, "name", ctx.name);
    			attr(input, "type", "text");
    			attr(input, "placeholder", ctx.placeholder);
    			attr(input, "class", "svelte-2sz9jt");
    			add_location(input, file$7, 8, 0, 128);
    			dispose = listen(input, "input", ctx.input_input_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, input, anchor);

    			input.value = ctx.value;
    		},

    		p: function update(changed, ctx) {
    			if (changed.value && (input.value !== ctx.value)) input.value = ctx.value;

    			if (changed.id) {
    				attr(input, "id", ctx.id);
    			}

    			if (changed.name) {
    				attr(input, "name", ctx.name);
    			}

    			if (changed.placeholder) {
    				attr(input, "placeholder", ctx.placeholder);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(input);
    			}

    			dispose();
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { id, name, type, placeholder, value } = $$props;

    	const writable_props = ['id', 'name', 'type', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		id,
    		name,
    		type,
    		placeholder,
    		value,
    		input_input_handler
    	};
    }

    class Index$7 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["id", "name", "type", "placeholder", "value"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Index> was created without expected prop 'id'");
    		}
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<Index> was created without expected prop 'name'");
    		}
    		if (ctx.type === undefined && !('type' in props)) {
    			console.warn("<Index> was created without expected prop 'type'");
    		}
    		if (ctx.placeholder === undefined && !('placeholder' in props)) {
    			console.warn("<Index> was created without expected prop 'placeholder'");
    		}
    		if (ctx.value === undefined && !('value' in props)) {
    			console.warn("<Index> was created without expected prop 'value'");
    		}
    	}

    	get id() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Molecules\FormText\index.svelte generated by Svelte v3.6.1 */

    const file$8 = "src\\Molecules\\FormText\\index.svelte";

    function create_fragment$8(ctx) {
    	var div, label, t0, t1, updating_value, current;

    	function forminput_value_binding(value_1) {
    		ctx.forminput_value_binding.call(null, value_1);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let forminput_props = {
    		id: ctx.id,
    		name: ctx.name,
    		type: ctx.type,
    		placeholder: ctx.placeholder
    	};
    	if (ctx.value !== void 0) {
    		forminput_props.value = ctx.value;
    	}
    	var forminput = new Index$7({ props: forminput_props, $$inline: true });

    	add_binding_callback(() => bind(forminput, 'value', forminput_value_binding));

    	return {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(ctx.text);
    			t1 = space();
    			forminput.$$.fragment.c();
    			attr(label, "class", "firstname svelte-gcdvlr");
    			attr(label, "for", ctx.name);
    			add_location(label, file$8, 11, 4, 236);
    			attr(div, "class", "form--row svelte-gcdvlr");
    			add_location(div, file$8, 10, 0, 207);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(label, t0);
    			append(div, t1);
    			mount_component(forminput, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.text) {
    				set_data(t0, ctx.text);
    			}

    			if (!current || changed.name) {
    				attr(label, "for", ctx.name);
    			}

    			var forminput_changes = {};
    			if (changed.id) forminput_changes.id = ctx.id;
    			if (changed.name) forminput_changes.name = ctx.name;
    			if (changed.type) forminput_changes.type = ctx.type;
    			if (changed.placeholder) forminput_changes.placeholder = ctx.placeholder;
    			if (!updating_value && changed.value) {
    				forminput_changes.value = ctx.value;
    			}
    			forminput.$set(forminput_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(forminput.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(forminput.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(forminput, );
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { id, name, type, placeholder, text, value } = $$props;

    	const writable_props = ['id', 'name', 'type', 'placeholder', 'text', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function forminput_value_binding(value_1) {
    		value = value_1;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		id,
    		name,
    		type,
    		placeholder,
    		text,
    		value,
    		forminput_value_binding
    	};
    }

    class Index$8 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["id", "name", "type", "placeholder", "text", "value"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Index> was created without expected prop 'id'");
    		}
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<Index> was created without expected prop 'name'");
    		}
    		if (ctx.type === undefined && !('type' in props)) {
    			console.warn("<Index> was created without expected prop 'type'");
    		}
    		if (ctx.placeholder === undefined && !('placeholder' in props)) {
    			console.warn("<Index> was created without expected prop 'placeholder'");
    		}
    		if (ctx.text === undefined && !('text' in props)) {
    			console.warn("<Index> was created without expected prop 'text'");
    		}
    		if (ctx.value === undefined && !('value' in props)) {
    			console.warn("<Index> was created without expected prop 'value'");
    		}
    	}

    	get id() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Atoms\Select\index.svelte generated by Svelte v3.6.1 */

    const file$9 = "src\\Atoms\\Select\\index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.val = list[i];
    	return child_ctx;
    }

    // (31:2) {#each selectValues as val}
    function create_each_block(ctx) {
    	var option, t0_value = ctx.val.text, t0, t1, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = ctx.val.value;
    			option.value = option.__value;
    			attr(option, "class", "svelte-sf2265");
    			add_location(option, file$9, 31, 2, 503);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t0);
    			append(option, t1);
    		},

    		p: function update(changed, ctx) {
    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	var select, option, dispose;

    	var each_value = ctx.selectValues;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			select = element("select");
    			option = element("option");
    			option.textContent = "Välj status";

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			option.selected = true;
    			option.__value = "Välj status";
    			option.value = option.__value;
    			attr(option, "class", "svelte-sf2265");
    			add_location(option, file$9, 29, 2, 431);
    			if (ctx.selected === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr(select, "id", ctx.id);
    			attr(select, "class", "svelte-sf2265");
    			add_location(select, file$9, 28, 0, 385);
    			dispose = listen(select, "change", ctx.select_change_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, select, anchor);
    			append(select, option);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selected);
    		},

    		p: function update(changed, ctx) {
    			if (changed.selectValues) {
    				each_value = ctx.selectValues;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.selected) select_option(select, ctx.selected);

    			if (changed.id) {
    				attr(select, "id", ctx.id);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(select);
    			}

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { selected, id } = $$props;

      let selectValues = [
        {
          value: "1",
          text: "Kontakt"
        },
        {
          value: "2",
          text: "Dialog"
        },
        {
          value: "3",
          text: "Intervju"
        },
        {
          value: "4",
          text: "Erbjudande"
        },
        {
          value: "5",
          text: "Avslutad"
        }
      ];

    	const writable_props = ['selected', 'id'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate('selected', selected);
    		$$invalidate('selectValues', selectValues);
    	}

    	$$self.$set = $$props => {
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    	};

    	return {
    		selected,
    		id,
    		selectValues,
    		select_change_handler
    	};
    }

    class Index$9 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["selected", "id"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.selected === undefined && !('selected' in props)) {
    			console.warn("<Index> was created without expected prop 'selected'");
    		}
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Index> was created without expected prop 'id'");
    		}
    	}

    	get selected() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Molecules\FormSelect\index.svelte generated by Svelte v3.6.1 */

    const file$a = "src\\Molecules\\FormSelect\\index.svelte";

    function create_fragment$a(ctx) {
    	var div, label, t0, t1, updating_selected, current;

    	function formselect_selected_binding(value) {
    		ctx.formselect_selected_binding.call(null, value);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let formselect_props = { id: ctx.id };
    	if (ctx.selected !== void 0) {
    		formselect_props.selected = ctx.selected;
    	}
    	var formselect = new Index$9({ props: formselect_props, $$inline: true });

    	add_binding_callback(() => bind(formselect, 'selected', formselect_selected_binding));

    	return {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(ctx.text);
    			t1 = space();
    			formselect.$$.fragment.c();
    			attr(label, "class", "firstname svelte-gcdvlr");
    			attr(label, "for", name);
    			add_location(label, file$a, 8, 2, 172);
    			attr(div, "class", "form--row svelte-gcdvlr");
    			add_location(div, file$a, 7, 0, 145);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label);
    			append(label, t0);
    			append(div, t1);
    			mount_component(formselect, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.text) {
    				set_data(t0, ctx.text);
    			}

    			var formselect_changes = {};
    			if (changed.id) formselect_changes.id = ctx.id;
    			if (!updating_selected && changed.selected) {
    				formselect_changes.selected = ctx.selected;
    			}
    			formselect.$set(formselect_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(formselect.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(formselect.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(formselect, );
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { id, text, selected } = $$props;

    	const writable_props = ['id', 'text', 'selected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function formselect_selected_binding(value) {
    		selected = value;
    		$$invalidate('selected', selected);
    	}

    	$$self.$set = $$props => {
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	return {
    		id,
    		text,
    		selected,
    		formselect_selected_binding
    	};
    }

    class Index$a extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["id", "text", "selected"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.id === undefined && !('id' in props)) {
    			console.warn("<Index> was created without expected prop 'id'");
    		}
    		if (ctx.text === undefined && !('text' in props)) {
    			console.warn("<Index> was created without expected prop 'text'");
    		}
    		if (ctx.selected === undefined && !('selected' in props)) {
    			console.warn("<Index> was created without expected prop 'selected'");
    		}
    	}

    	get id() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Organisms\AddUserForm\index.svelte generated by Svelte v3.6.1 */

    const file$b = "src\\Organisms\\AddUserForm\\index.svelte";

    function create_fragment$b(ctx) {
    	var div1, h3, t1, fieldset, updating_value, t2, updating_value_1, t3, updating_value_2, t4, updating_value_3, t5, updating_value_4, t6, updating_selected, t7, div0, input, current, dispose;

    	function formtext0_value_binding(value) {
    		ctx.formtext0_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let formtext0_props = {
    		id: "firstname",
    		name: "firstname",
    		type: "text",
    		placeholder: "Joe",
    		text: "Förnamn"
    	};
    	if (ctx.valueFirstName !== void 0) {
    		formtext0_props.value = ctx.valueFirstName;
    	}
    	var formtext0 = new Index$8({ props: formtext0_props, $$inline: true });

    	add_binding_callback(() => bind(formtext0, 'value', formtext0_value_binding));

    	function formtext1_value_binding(value_1) {
    		ctx.formtext1_value_binding.call(null, value_1);
    		updating_value_1 = true;
    		add_flush_callback(() => updating_value_1 = false);
    	}

    	let formtext1_props = {
    		id: "lastname",
    		name: "lastname",
    		type: "text",
    		placeholder: "Doe",
    		text: "Efternamn"
    	};
    	if (ctx.valueLastName !== void 0) {
    		formtext1_props.value = ctx.valueLastName;
    	}
    	var formtext1 = new Index$8({ props: formtext1_props, $$inline: true });

    	add_binding_callback(() => bind(formtext1, 'value', formtext1_value_binding));

    	function formtext2_value_binding(value_2) {
    		ctx.formtext2_value_binding.call(null, value_2);
    		updating_value_2 = true;
    		add_flush_callback(() => updating_value_2 = false);
    	}

    	let formtext2_props = {
    		id: "age",
    		name: "age",
    		type: "text",
    		placeholder: "25",
    		text: "Ålder"
    	};
    	if (ctx.valueAge !== void 0) {
    		formtext2_props.value = ctx.valueAge;
    	}
    	var formtext2 = new Index$8({ props: formtext2_props, $$inline: true });

    	add_binding_callback(() => bind(formtext2, 'value', formtext2_value_binding));

    	function formtext3_value_binding(value_3) {
    		ctx.formtext3_value_binding.call(null, value_3);
    		updating_value_3 = true;
    		add_flush_callback(() => updating_value_3 = false);
    	}

    	let formtext3_props = {
    		id: "email",
    		name: "email",
    		type: "email",
    		placeholder: "Joe.doe@example.com",
    		text: "Email"
    	};
    	if (ctx.valueEmail !== void 0) {
    		formtext3_props.value = ctx.valueEmail;
    	}
    	var formtext3 = new Index$8({ props: formtext3_props, $$inline: true });

    	add_binding_callback(() => bind(formtext3, 'value', formtext3_value_binding));

    	function formtext4_value_binding(value_4) {
    		ctx.formtext4_value_binding.call(null, value_4);
    		updating_value_4 = true;
    		add_flush_callback(() => updating_value_4 = false);
    	}

    	let formtext4_props = {
    		id: "address",
    		name: "address",
    		type: "text",
    		placeholder: "Adress 123",
    		text: "Adress"
    	};
    	if (ctx.valueAddress !== void 0) {
    		formtext4_props.value = ctx.valueAddress;
    	}
    	var formtext4 = new Index$8({ props: formtext4_props, $$inline: true });

    	add_binding_callback(() => bind(formtext4, 'value', formtext4_value_binding));

    	function formselect_selected_binding(value_5) {
    		ctx.formselect_selected_binding.call(null, value_5);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let formselect_props = { id: "status", text: "Status" };
    	if (ctx.selected !== void 0) {
    		formselect_props.selected = ctx.selected;
    	}
    	var formselect = new Index$a({ props: formselect_props, $$inline: true });

    	add_binding_callback(() => bind(formselect, 'selected', formselect_selected_binding));

    	return {
    		c: function create() {
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Lägg till användare";
    			t1 = space();
    			fieldset = element("fieldset");
    			formtext0.$$.fragment.c();
    			t2 = space();
    			formtext1.$$.fragment.c();
    			t3 = space();
    			formtext2.$$.fragment.c();
    			t4 = space();
    			formtext3.$$.fragment.c();
    			t5 = space();
    			formtext4.$$.fragment.c();
    			t6 = space();
    			formselect.$$.fragment.c();
    			t7 = space();
    			div0 = element("div");
    			input = element("input");
    			attr(h3, "class", "svelte-xphjt");
    			add_location(h3, file$b, 13, 4, 404);
    			add_location(fieldset, file$b, 14, 4, 438);
    			attr(input, "type", "submit");
    			input.value = "Lägg till";
    			input.disabled = ctx.disabled;
    			attr(input, "class", "svelte-xphjt");
    			add_location(input, file$b, 23, 8, 1180);
    			attr(div0, "class", "submit--row svelte-xphjt");
    			add_location(div0, file$b, 22, 4, 1145);
    			attr(div1, "class", "svelte-xphjt");
    			add_location(div1, file$b, 12, 0, 393);
    			dispose = listen(input, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, h3);
    			append(div1, t1);
    			append(div1, fieldset);
    			mount_component(formtext0, fieldset, null);
    			append(fieldset, t2);
    			mount_component(formtext1, fieldset, null);
    			append(fieldset, t3);
    			mount_component(formtext2, fieldset, null);
    			append(fieldset, t4);
    			mount_component(formtext3, fieldset, null);
    			append(fieldset, t5);
    			mount_component(formtext4, fieldset, null);
    			append(fieldset, t6);
    			mount_component(formselect, fieldset, null);
    			append(div1, t7);
    			append(div1, div0);
    			append(div0, input);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var formtext0_changes = {};
    			if (!updating_value && changed.valueFirstName) {
    				formtext0_changes.value = ctx.valueFirstName;
    			}
    			formtext0.$set(formtext0_changes);

    			var formtext1_changes = {};
    			if (!updating_value_1 && changed.valueLastName) {
    				formtext1_changes.value = ctx.valueLastName;
    			}
    			formtext1.$set(formtext1_changes);

    			var formtext2_changes = {};
    			if (!updating_value_2 && changed.valueAge) {
    				formtext2_changes.value = ctx.valueAge;
    			}
    			formtext2.$set(formtext2_changes);

    			var formtext3_changes = {};
    			if (!updating_value_3 && changed.valueEmail) {
    				formtext3_changes.value = ctx.valueEmail;
    			}
    			formtext3.$set(formtext3_changes);

    			var formtext4_changes = {};
    			if (!updating_value_4 && changed.valueAddress) {
    				formtext4_changes.value = ctx.valueAddress;
    			}
    			formtext4.$set(formtext4_changes);

    			var formselect_changes = {};
    			if (!updating_selected && changed.selected) {
    				formselect_changes.selected = ctx.selected;
    			}
    			formselect.$set(formselect_changes);

    			if (!current || changed.disabled) {
    				input.disabled = ctx.disabled;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(formtext0.$$.fragment, local);

    			transition_in(formtext1.$$.fragment, local);

    			transition_in(formtext2.$$.fragment, local);

    			transition_in(formtext3.$$.fragment, local);

    			transition_in(formtext4.$$.fragment, local);

    			transition_in(formselect.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(formtext0.$$.fragment, local);
    			transition_out(formtext1.$$.fragment, local);
    			transition_out(formtext2.$$.fragment, local);
    			transition_out(formtext3.$$.fragment, local);
    			transition_out(formtext4.$$.fragment, local);
    			transition_out(formselect.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			destroy_component(formtext0, );

    			destroy_component(formtext1, );

    			destroy_component(formtext2, );

    			destroy_component(formtext3, );

    			destroy_component(formtext4, );

    			destroy_component(formselect, );

    			dispose();
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	
      let { valueFirstName, valueLastName, valueEmail, valueAddress, valueAge, selected, disabled } = $$props;

    	const writable_props = ['valueFirstName', 'valueLastName', 'valueEmail', 'valueAddress', 'valueAge', 'selected', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function formtext0_value_binding(value) {
    		valueFirstName = value;
    		$$invalidate('valueFirstName', valueFirstName);
    	}

    	function formtext1_value_binding(value_1) {
    		valueLastName = value_1;
    		$$invalidate('valueLastName', valueLastName);
    	}

    	function formtext2_value_binding(value_2) {
    		valueAge = value_2;
    		$$invalidate('valueAge', valueAge);
    	}

    	function formtext3_value_binding(value_3) {
    		valueEmail = value_3;
    		$$invalidate('valueEmail', valueEmail);
    	}

    	function formtext4_value_binding(value_4) {
    		valueAddress = value_4;
    		$$invalidate('valueAddress', valueAddress);
    	}

    	function formselect_selected_binding(value_5) {
    		selected = value_5;
    		$$invalidate('selected', selected);
    	}

    	$$self.$set = $$props => {
    		if ('valueFirstName' in $$props) $$invalidate('valueFirstName', valueFirstName = $$props.valueFirstName);
    		if ('valueLastName' in $$props) $$invalidate('valueLastName', valueLastName = $$props.valueLastName);
    		if ('valueEmail' in $$props) $$invalidate('valueEmail', valueEmail = $$props.valueEmail);
    		if ('valueAddress' in $$props) $$invalidate('valueAddress', valueAddress = $$props.valueAddress);
    		if ('valueAge' in $$props) $$invalidate('valueAge', valueAge = $$props.valueAge);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	return {
    		valueFirstName,
    		valueLastName,
    		valueEmail,
    		valueAddress,
    		valueAge,
    		selected,
    		disabled,
    		click_handler,
    		formtext0_value_binding,
    		formtext1_value_binding,
    		formtext2_value_binding,
    		formtext3_value_binding,
    		formtext4_value_binding,
    		formselect_selected_binding
    	};
    }

    class Index$b extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["valueFirstName", "valueLastName", "valueEmail", "valueAddress", "valueAge", "selected", "disabled"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.valueFirstName === undefined && !('valueFirstName' in props)) {
    			console.warn("<Index> was created without expected prop 'valueFirstName'");
    		}
    		if (ctx.valueLastName === undefined && !('valueLastName' in props)) {
    			console.warn("<Index> was created without expected prop 'valueLastName'");
    		}
    		if (ctx.valueEmail === undefined && !('valueEmail' in props)) {
    			console.warn("<Index> was created without expected prop 'valueEmail'");
    		}
    		if (ctx.valueAddress === undefined && !('valueAddress' in props)) {
    			console.warn("<Index> was created without expected prop 'valueAddress'");
    		}
    		if (ctx.valueAge === undefined && !('valueAge' in props)) {
    			console.warn("<Index> was created without expected prop 'valueAge'");
    		}
    		if (ctx.selected === undefined && !('selected' in props)) {
    			console.warn("<Index> was created without expected prop 'selected'");
    		}
    		if (ctx.disabled === undefined && !('disabled' in props)) {
    			console.warn("<Index> was created without expected prop 'disabled'");
    		}
    	}

    	get valueFirstName() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueFirstName(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueLastName() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueLastName(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueEmail() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueEmail(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueAddress() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueAddress(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueAge() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueAge(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var atoa = function atoa (a, n) { return Array.prototype.slice.call(a, n); };

    var si = typeof setImmediate === 'function', tick;
    if (si) {
      tick = function (fn) { setImmediate(fn); };
    } else {
      tick = function (fn) { setTimeout(fn, 0); };
    }

    var tickyBrowser = tick;

    var debounce = function debounce (fn, args, ctx) {
      if (!fn) { return; }
      tickyBrowser(function run () {
        fn.apply(ctx || null, args || []);
      });
    };

    var emitter = function emitter (thing, options) {
      var opts = options || {};
      var evt = {};
      if (thing === undefined) { thing = {}; }
      thing.on = function (type, fn) {
        if (!evt[type]) {
          evt[type] = [fn];
        } else {
          evt[type].push(fn);
        }
        return thing;
      };
      thing.once = function (type, fn) {
        fn._once = true; // thing.off(fn) still works!
        thing.on(type, fn);
        return thing;
      };
      thing.off = function (type, fn) {
        var c = arguments.length;
        if (c === 1) {
          delete evt[type];
        } else if (c === 0) {
          evt = {};
        } else {
          var et = evt[type];
          if (!et) { return thing; }
          et.splice(et.indexOf(fn), 1);
        }
        return thing;
      };
      thing.emit = function () {
        var args = atoa(arguments);
        return thing.emitterSnapshot(args.shift()).apply(this, args);
      };
      thing.emitterSnapshot = function (type) {
        var et = (evt[type] || []).slice(0);
        return function () {
          var args = atoa(arguments);
          var ctx = this || thing;
          if (type === 'error' && opts.throws !== false && !et.length) { throw args.length === 1 ? args[0] : args; }
          et.forEach(function emitter (listen) {
            if (opts.async) { debounce(listen, args, ctx); } else { listen.apply(ctx, args); }
            if (listen._once) { thing.off(type, listen); }
          });
          return thing;
        };
      };
      return thing;
    };

    var NativeCustomEvent = commonjsGlobal.CustomEvent;

    function useNative () {
      try {
        var p = new NativeCustomEvent('cat', { detail: { foo: 'bar' } });
        return  'cat' === p.type && 'bar' === p.detail.foo;
      } catch (e) {
      }
      return false;
    }

    /**
     * Cross-browser `CustomEvent` constructor.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent.CustomEvent
     *
     * @public
     */

    var customEvent = useNative() ? NativeCustomEvent :

    // IE >= 9
    'function' === typeof document.createEvent ? function CustomEvent (type, params) {
      var e = document.createEvent('CustomEvent');
      if (params) {
        e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
      } else {
        e.initCustomEvent(type, false, false, void 0);
      }
      return e;
    } :

    // IE <= 8
    function CustomEvent (type, params) {
      var e = document.createEventObject();
      e.type = type;
      if (params) {
        e.bubbles = Boolean(params.bubbles);
        e.cancelable = Boolean(params.cancelable);
        e.detail = params.detail;
      } else {
        e.bubbles = false;
        e.cancelable = false;
        e.detail = void 0;
      }
      return e;
    };

    var eventmap = [];
    var eventname = '';
    var ron = /^on/;

    for (eventname in commonjsGlobal) {
      if (ron.test(eventname)) {
        eventmap.push(eventname.slice(2));
      }
    }

    var eventmap_1 = eventmap;

    var doc = commonjsGlobal.document;
    var addEvent = addEventEasy;
    var removeEvent = removeEventEasy;
    var hardCache = [];

    if (!commonjsGlobal.addEventListener) {
      addEvent = addEventHard;
      removeEvent = removeEventHard;
    }

    var crossvent = {
      add: addEvent,
      remove: removeEvent,
      fabricate: fabricateEvent
    };

    function addEventEasy (el, type, fn, capturing) {
      return el.addEventListener(type, fn, capturing);
    }

    function addEventHard (el, type, fn) {
      return el.attachEvent('on' + type, wrap(el, type, fn));
    }

    function removeEventEasy (el, type, fn, capturing) {
      return el.removeEventListener(type, fn, capturing);
    }

    function removeEventHard (el, type, fn) {
      var listener = unwrap(el, type, fn);
      if (listener) {
        return el.detachEvent('on' + type, listener);
      }
    }

    function fabricateEvent (el, type, model) {
      var e = eventmap_1.indexOf(type) === -1 ? makeCustomEvent() : makeClassicEvent();
      if (el.dispatchEvent) {
        el.dispatchEvent(e);
      } else {
        el.fireEvent('on' + type, e);
      }
      function makeClassicEvent () {
        var e;
        if (doc.createEvent) {
          e = doc.createEvent('Event');
          e.initEvent(type, true, true);
        } else if (doc.createEventObject) {
          e = doc.createEventObject();
        }
        return e;
      }
      function makeCustomEvent () {
        return new customEvent(type, { detail: model });
      }
    }

    function wrapperFactory (el, type, fn) {
      return function wrapper (originalEvent) {
        var e = originalEvent || commonjsGlobal.event;
        e.target = e.target || e.srcElement;
        e.preventDefault = e.preventDefault || function preventDefault () { e.returnValue = false; };
        e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
        e.which = e.which || e.keyCode;
        fn.call(el, e);
      };
    }

    function wrap (el, type, fn) {
      var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
      hardCache.push({
        wrapper: wrapper,
        element: el,
        type: type,
        fn: fn
      });
      return wrapper;
    }

    function unwrap (el, type, fn) {
      var i = find(el, type, fn);
      if (i) {
        var wrapper = hardCache[i].wrapper;
        hardCache.splice(i, 1); // free up a tad of memory
        return wrapper;
      }
    }

    function find (el, type, fn) {
      var i, item;
      for (i = 0; i < hardCache.length; i++) {
        item = hardCache[i];
        if (item.element === el && item.type === type && item.fn === fn) {
          return i;
        }
      }
    }

    var cache = {};
    var start = '(?:^|\\s)';
    var end = '(?:\\s|$)';

    function lookupClass (className) {
      var cached = cache[className];
      if (cached) {
        cached.lastIndex = 0;
      } else {
        cache[className] = cached = new RegExp(start + className + end, 'g');
      }
      return cached;
    }

    function addClass (el, className) {
      var current = el.className;
      if (!current.length) {
        el.className = className;
      } else if (!lookupClass(className).test(current)) {
        el.className += ' ' + className;
      }
    }

    function rmClass (el, className) {
      el.className = el.className.replace(lookupClass(className), ' ').trim();
    }

    var classes = {
      add: addClass,
      rm: rmClass
    };

    var doc$1 = document;
    var documentElement = doc$1.documentElement;

    function dragula (initialContainers, options) {
      var len = arguments.length;
      if (len === 1 && Array.isArray(initialContainers) === false) {
        options = initialContainers;
        initialContainers = [];
      }
      var _mirror; // mirror image
      var _source; // source container
      var _item; // item being dragged
      var _offsetX; // reference x
      var _offsetY; // reference y
      var _moveX; // reference move x
      var _moveY; // reference move y
      var _initialSibling; // reference sibling when grabbed
      var _currentSibling; // reference sibling now
      var _copy; // item used for copying
      var _renderTimer; // timer for setTimeout renderMirrorImage
      var _lastDropTarget = null; // last container item was over
      var _grabbed; // holds mousedown context until first mousemove

      var o = options || {};
      if (o.moves === void 0) { o.moves = always; }
      if (o.accepts === void 0) { o.accepts = always; }
      if (o.invalid === void 0) { o.invalid = invalidTarget; }
      if (o.containers === void 0) { o.containers = initialContainers || []; }
      if (o.isContainer === void 0) { o.isContainer = never; }
      if (o.copy === void 0) { o.copy = false; }
      if (o.copySortSource === void 0) { o.copySortSource = false; }
      if (o.revertOnSpill === void 0) { o.revertOnSpill = false; }
      if (o.removeOnSpill === void 0) { o.removeOnSpill = false; }
      if (o.direction === void 0) { o.direction = 'vertical'; }
      if (o.ignoreInputTextSelection === void 0) { o.ignoreInputTextSelection = true; }
      if (o.mirrorContainer === void 0) { o.mirrorContainer = doc$1.body; }

      var drake = emitter({
        containers: o.containers,
        start: manualStart,
        end: end,
        cancel: cancel,
        remove: remove,
        destroy: destroy,
        canMove: canMove,
        dragging: false
      });

      if (o.removeOnSpill === true) {
        drake.on('over', spillOver).on('out', spillOut);
      }

      events();

      return drake;

      function isContainer (el) {
        return drake.containers.indexOf(el) !== -1 || o.isContainer(el);
      }

      function events (remove) {
        var op = remove ? 'remove' : 'add';
        touchy(documentElement, op, 'mousedown', grab);
        touchy(documentElement, op, 'mouseup', release);
      }

      function eventualMovements (remove) {
        var op = remove ? 'remove' : 'add';
        touchy(documentElement, op, 'mousemove', startBecauseMouseMoved);
      }

      function movements (remove) {
        var op = remove ? 'remove' : 'add';
        crossvent[op](documentElement, 'selectstart', preventGrabbed); // IE8
        crossvent[op](documentElement, 'click', preventGrabbed);
      }

      function destroy () {
        events(true);
        release({});
      }

      function preventGrabbed (e) {
        if (_grabbed) {
          e.preventDefault();
        }
      }

      function grab (e) {
        _moveX = e.clientX;
        _moveY = e.clientY;

        var ignore = whichMouseButton(e) !== 1 || e.metaKey || e.ctrlKey;
        if (ignore) {
          return; // we only care about honest-to-god left clicks and touch events
        }
        var item = e.target;
        var context = canStart(item);
        if (!context) {
          return;
        }
        _grabbed = context;
        eventualMovements();
        if (e.type === 'mousedown') {
          if (isInput(item)) { // see also: https://github.com/bevacqua/dragula/issues/208
            item.focus(); // fixes https://github.com/bevacqua/dragula/issues/176
          } else {
            e.preventDefault(); // fixes https://github.com/bevacqua/dragula/issues/155
          }
        }
      }

      function startBecauseMouseMoved (e) {
        if (!_grabbed) {
          return;
        }
        if (whichMouseButton(e) === 0) {
          release({});
          return; // when text is selected on an input and then dragged, mouseup doesn't fire. this is our only hope
        }
        // truthy check fixes #239, equality fixes #207
        if (e.clientX !== void 0 && e.clientX === _moveX && e.clientY !== void 0 && e.clientY === _moveY) {
          return;
        }
        if (o.ignoreInputTextSelection) {
          var clientX = getCoord('clientX', e);
          var clientY = getCoord('clientY', e);
          var elementBehindCursor = doc$1.elementFromPoint(clientX, clientY);
          if (isInput(elementBehindCursor)) {
            return;
          }
        }

        var grabbed = _grabbed; // call to end() unsets _grabbed
        eventualMovements(true);
        movements();
        end();
        start(grabbed);

        var offset = getOffset(_item);
        _offsetX = getCoord('pageX', e) - offset.left;
        _offsetY = getCoord('pageY', e) - offset.top;

        classes.add(_copy || _item, 'gu-transit');
        renderMirrorImage();
        drag(e);
      }

      function canStart (item) {
        if (drake.dragging && _mirror) {
          return;
        }
        if (isContainer(item)) {
          return; // don't drag container itself
        }
        var handle = item;
        while (getParent(item) && isContainer(getParent(item)) === false) {
          if (o.invalid(item, handle)) {
            return;
          }
          item = getParent(item); // drag target should be a top element
          if (!item) {
            return;
          }
        }
        var source = getParent(item);
        if (!source) {
          return;
        }
        if (o.invalid(item, handle)) {
          return;
        }

        var movable = o.moves(item, source, handle, nextEl(item));
        if (!movable) {
          return;
        }

        return {
          item: item,
          source: source
        };
      }

      function canMove (item) {
        return !!canStart(item);
      }

      function manualStart (item) {
        var context = canStart(item);
        if (context) {
          start(context);
        }
      }

      function start (context) {
        if (isCopy(context.item, context.source)) {
          _copy = context.item.cloneNode(true);
          drake.emit('cloned', _copy, context.item, 'copy');
        }

        _source = context.source;
        _item = context.item;
        _initialSibling = _currentSibling = nextEl(context.item);

        drake.dragging = true;
        drake.emit('drag', _item, _source);
      }

      function invalidTarget () {
        return false;
      }

      function end () {
        if (!drake.dragging) {
          return;
        }
        var item = _copy || _item;
        drop(item, getParent(item));
      }

      function ungrab () {
        _grabbed = false;
        eventualMovements(true);
        movements(true);
      }

      function release (e) {
        ungrab();

        if (!drake.dragging) {
          return;
        }
        var item = _copy || _item;
        var clientX = getCoord('clientX', e);
        var clientY = getCoord('clientY', e);
        var elementBehindCursor = getElementBehindPoint(_mirror, clientX, clientY);
        var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
        if (dropTarget && ((_copy && o.copySortSource) || (!_copy || dropTarget !== _source))) {
          drop(item, dropTarget);
        } else if (o.removeOnSpill) {
          remove();
        } else {
          cancel();
        }
      }

      function drop (item, target) {
        var parent = getParent(item);
        if (_copy && o.copySortSource && target === _source) {
          parent.removeChild(_item);
        }
        if (isInitialPlacement(target)) {
          drake.emit('cancel', item, _source, _source);
        } else {
          drake.emit('drop', item, target, _source, _currentSibling);
        }
        cleanup();
      }

      function remove () {
        if (!drake.dragging) {
          return;
        }
        var item = _copy || _item;
        var parent = getParent(item);
        if (parent) {
          parent.removeChild(item);
        }
        drake.emit(_copy ? 'cancel' : 'remove', item, parent, _source);
        cleanup();
      }

      function cancel (revert) {
        if (!drake.dragging) {
          return;
        }
        var reverts = arguments.length > 0 ? revert : o.revertOnSpill;
        var item = _copy || _item;
        var parent = getParent(item);
        var initial = isInitialPlacement(parent);
        if (initial === false && reverts) {
          if (_copy) {
            if (parent) {
              parent.removeChild(_copy);
            }
          } else {
            _source.insertBefore(item, _initialSibling);
          }
        }
        if (initial || reverts) {
          drake.emit('cancel', item, _source, _source);
        } else {
          drake.emit('drop', item, parent, _source, _currentSibling);
        }
        cleanup();
      }

      function cleanup () {
        var item = _copy || _item;
        ungrab();
        removeMirrorImage();
        if (item) {
          classes.rm(item, 'gu-transit');
        }
        if (_renderTimer) {
          clearTimeout(_renderTimer);
        }
        drake.dragging = false;
        if (_lastDropTarget) {
          drake.emit('out', item, _lastDropTarget, _source);
        }
        drake.emit('dragend', item);
        _source = _item = _copy = _initialSibling = _currentSibling = _renderTimer = _lastDropTarget = null;
      }

      function isInitialPlacement (target, s) {
        var sibling;
        if (s !== void 0) {
          sibling = s;
        } else if (_mirror) {
          sibling = _currentSibling;
        } else {
          sibling = nextEl(_copy || _item);
        }
        return target === _source && sibling === _initialSibling;
      }

      function findDropTarget (elementBehindCursor, clientX, clientY) {
        var target = elementBehindCursor;
        while (target && !accepted()) {
          target = getParent(target);
        }
        return target;

        function accepted () {
          var droppable = isContainer(target);
          if (droppable === false) {
            return false;
          }

          var immediate = getImmediateChild(target, elementBehindCursor);
          var reference = getReference(target, immediate, clientX, clientY);
          var initial = isInitialPlacement(target, reference);
          if (initial) {
            return true; // should always be able to drop it right back where it was
          }
          return o.accepts(_item, target, _source, reference);
        }
      }

      function drag (e) {
        if (!_mirror) {
          return;
        }
        e.preventDefault();

        var clientX = getCoord('clientX', e);
        var clientY = getCoord('clientY', e);
        var x = clientX - _offsetX;
        var y = clientY - _offsetY;

        _mirror.style.left = x + 'px';
        _mirror.style.top = y + 'px';

        var item = _copy || _item;
        var elementBehindCursor = getElementBehindPoint(_mirror, clientX, clientY);
        var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
        var changed = dropTarget !== null && dropTarget !== _lastDropTarget;
        if (changed || dropTarget === null) {
          out();
          _lastDropTarget = dropTarget;
          over();
        }
        var parent = getParent(item);
        if (dropTarget === _source && _copy && !o.copySortSource) {
          if (parent) {
            parent.removeChild(item);
          }
          return;
        }
        var reference;
        var immediate = getImmediateChild(dropTarget, elementBehindCursor);
        if (immediate !== null) {
          reference = getReference(dropTarget, immediate, clientX, clientY);
        } else if (o.revertOnSpill === true && !_copy) {
          reference = _initialSibling;
          dropTarget = _source;
        } else {
          if (_copy && parent) {
            parent.removeChild(item);
          }
          return;
        }
        if (
          (reference === null && changed) ||
          reference !== item &&
          reference !== nextEl(item)
        ) {
          _currentSibling = reference;
          dropTarget.insertBefore(item, reference);
          drake.emit('shadow', item, dropTarget, _source);
        }
        function moved (type) { drake.emit(type, item, _lastDropTarget, _source); }
        function over () { if (changed) { moved('over'); } }
        function out () { if (_lastDropTarget) { moved('out'); } }
      }

      function spillOver (el) {
        classes.rm(el, 'gu-hide');
      }

      function spillOut (el) {
        if (drake.dragging) { classes.add(el, 'gu-hide'); }
      }

      function renderMirrorImage () {
        if (_mirror) {
          return;
        }
        var rect = _item.getBoundingClientRect();
        _mirror = _item.cloneNode(true);
        _mirror.style.width = getRectWidth(rect) + 'px';
        _mirror.style.height = getRectHeight(rect) + 'px';
        classes.rm(_mirror, 'gu-transit');
        classes.add(_mirror, 'gu-mirror');
        o.mirrorContainer.appendChild(_mirror);
        touchy(documentElement, 'add', 'mousemove', drag);
        classes.add(o.mirrorContainer, 'gu-unselectable');
        drake.emit('cloned', _mirror, _item, 'mirror');
      }

      function removeMirrorImage () {
        if (_mirror) {
          classes.rm(o.mirrorContainer, 'gu-unselectable');
          touchy(documentElement, 'remove', 'mousemove', drag);
          getParent(_mirror).removeChild(_mirror);
          _mirror = null;
        }
      }

      function getImmediateChild (dropTarget, target) {
        var immediate = target;
        while (immediate !== dropTarget && getParent(immediate) !== dropTarget) {
          immediate = getParent(immediate);
        }
        if (immediate === documentElement) {
          return null;
        }
        return immediate;
      }

      function getReference (dropTarget, target, x, y) {
        var horizontal = o.direction === 'horizontal';
        var reference = target !== dropTarget ? inside() : outside();
        return reference;

        function outside () { // slower, but able to figure out any position
          var len = dropTarget.children.length;
          var i;
          var el;
          var rect;
          for (i = 0; i < len; i++) {
            el = dropTarget.children[i];
            rect = el.getBoundingClientRect();
            if (horizontal && (rect.left + rect.width / 2) > x) { return el; }
            if (!horizontal && (rect.top + rect.height / 2) > y) { return el; }
          }
          return null;
        }

        function inside () { // faster, but only available if dropped inside a child element
          var rect = target.getBoundingClientRect();
          if (horizontal) {
            return resolve(x > rect.left + getRectWidth(rect) / 2);
          }
          return resolve(y > rect.top + getRectHeight(rect) / 2);
        }

        function resolve (after) {
          return after ? nextEl(target) : target;
        }
      }

      function isCopy (item, container) {
        return typeof o.copy === 'boolean' ? o.copy : o.copy(item, container);
      }
    }

    function touchy (el, op, type, fn) {
      var touch = {
        mouseup: 'touchend',
        mousedown: 'touchstart',
        mousemove: 'touchmove'
      };
      var pointers = {
        mouseup: 'pointerup',
        mousedown: 'pointerdown',
        mousemove: 'pointermove'
      };
      var microsoft = {
        mouseup: 'MSPointerUp',
        mousedown: 'MSPointerDown',
        mousemove: 'MSPointerMove'
      };
      if (commonjsGlobal.navigator.pointerEnabled) {
        crossvent[op](el, pointers[type], fn);
      } else if (commonjsGlobal.navigator.msPointerEnabled) {
        crossvent[op](el, microsoft[type], fn);
      } else {
        crossvent[op](el, touch[type], fn);
        crossvent[op](el, type, fn);
      }
    }

    function whichMouseButton (e) {
      if (e.touches !== void 0) { return e.touches.length; }
      if (e.which !== void 0 && e.which !== 0) { return e.which; } // see https://github.com/bevacqua/dragula/issues/261
      if (e.buttons !== void 0) { return e.buttons; }
      var button = e.button;
      if (button !== void 0) { // see https://github.com/jquery/jquery/blob/99e8ff1baa7ae341e94bb89c3e84570c7c3ad9ea/src/event.js#L573-L575
        return button & 1 ? 1 : button & 2 ? 3 : (button & 4 ? 2 : 0);
      }
    }

    function getOffset (el) {
      var rect = el.getBoundingClientRect();
      return {
        left: rect.left + getScroll('scrollLeft', 'pageXOffset'),
        top: rect.top + getScroll('scrollTop', 'pageYOffset')
      };
    }

    function getScroll (scrollProp, offsetProp) {
      if (typeof commonjsGlobal[offsetProp] !== 'undefined') {
        return commonjsGlobal[offsetProp];
      }
      if (documentElement.clientHeight) {
        return documentElement[scrollProp];
      }
      return doc$1.body[scrollProp];
    }

    function getElementBehindPoint (point, x, y) {
      var p = point || {};
      var state = p.className;
      var el;
      p.className += ' gu-hide';
      el = doc$1.elementFromPoint(x, y);
      p.className = state;
      return el;
    }

    function never () { return false; }
    function always () { return true; }
    function getRectWidth (rect) { return rect.width || (rect.right - rect.left); }
    function getRectHeight (rect) { return rect.height || (rect.bottom - rect.top); }
    function getParent (el) { return el.parentNode === doc$1 ? null : el.parentNode; }
    function isInput (el) { return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || isEditable(el); }
    function isEditable (el) {
      if (!el) { return false; } // no parents were editable
      if (el.contentEditable === 'false') { return false; } // stop the lookup
      if (el.contentEditable === 'true') { return true; } // found a contentEditable element in the chain
      return isEditable(getParent(el)); // contentEditable is set to 'inherit'
    }

    function nextEl (el) {
      return el.nextElementSibling || manually();
      function manually () {
        var sibling = el;
        do {
          sibling = sibling.nextSibling;
        } while (sibling && sibling.nodeType !== 1);
        return sibling;
      }
    }

    function getEventHost (e) {
      // on touchend event, we have to use `e.changedTouches`
      // see http://stackoverflow.com/questions/7192563/touchend-event-properties
      // see https://github.com/bevacqua/dragula/issues/34
      if (e.targetTouches && e.targetTouches.length) {
        return e.targetTouches[0];
      }
      if (e.changedTouches && e.changedTouches.length) {
        return e.changedTouches[0];
      }
      return e;
    }

    function getCoord (coord, e) {
      var host = getEventHost(e);
      var missMap = {
        pageX: 'clientX', // IE8
        pageY: 'clientY' // IE8
      };
      if (coord in missMap && !(coord in host) && missMap[coord] in host) {
        coord = missMap[coord];
      }
      return host[coord];
    }

    var dragula_1 = dragula;

    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (!stop) {
                    return; // not ready
                }
                subscribers.forEach((s) => s[1]());
                subscribers.forEach((s) => s[0](value));
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const data = writable(fakeData);

    /* src\Pages\App.svelte generated by Svelte v3.6.1 */

    const file$c = "src\\Pages\\App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (144:0) {:else}
    function create_else_block(ctx) {
    	var p;

    	return {
    		c: function create_1() {
    			p = element("p");
    			p.textContent = "Laddar...";
    			attr(p, "class", "loading");
    			add_location(p, file$c, 144, 2, 5120);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (83:0) {#if store_data}
    function create_if_block_2(ctx) {
    	var div, t0, ul, t1, t2, t3, t4, current;

    	var vbutton = new Index$2({
    		props: { text: "Visa alla" },
    		$$inline: true
    	});
    	vbutton.$on("click", ctx.click_handler);

    	var column0 = new Index$3({
    		props: {
    		text: "Kontakt",
    		accessor: "Contact",
    		$$slots: { default: [create_default_slot_6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	column0.$on("click", ctx.click_handler_1);

    	var column1 = new Index$3({
    		props: {
    		text: "Dialog",
    		accessor: "Dialog",
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	column1.$on("click", ctx.click_handler_2);

    	var column2 = new Index$3({
    		props: {
    		text: "Intervju",
    		accessor: "Interview",
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	column2.$on("click", ctx.click_handler_3);

    	var column3 = new Index$3({
    		props: {
    		text: "Erbjudande",
    		accessor: "Offer",
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	column3.$on("click", ctx.click_handler_4);

    	var column4 = new Index$3({
    		props: {
    		text: "Avslutad",
    		accessor: "Completed",
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	column4.$on("click", ctx.click_handler_5);

    	return {
    		c: function create_1() {
    			div = element("div");
    			vbutton.$$.fragment.c();
    			t0 = space();
    			ul = element("ul");
    			column0.$$.fragment.c();
    			t1 = space();
    			column1.$$.fragment.c();
    			t2 = space();
    			column2.$$.fragment.c();
    			t3 = space();
    			column3.$$.fragment.c();
    			t4 = space();
    			column4.$$.fragment.c();
    			attr(div, "class", "show-user-wrapper svelte-ye0m7i");
    			add_location(div, file$c, 83, 0, 2689);
    			attr(ul, "class", "board");
    			add_location(ul, file$c, 86, 4, 2809);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(vbutton, div, null);
    			insert(target, t0, anchor);
    			insert(target, ul, anchor);
    			mount_component(column0, ul, null);
    			append(ul, t1);
    			mount_component(column1, ul, null);
    			append(ul, t2);
    			mount_component(column2, ul, null);
    			append(ul, t3);
    			mount_component(column3, ul, null);
    			append(ul, t4);
    			mount_component(column4, ul, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var column0_changes = {};
    			if (changed.$$scope || changed.store_data) column0_changes.$$scope = { changed, ctx };
    			column0.$set(column0_changes);

    			var column1_changes = {};
    			if (changed.$$scope || changed.store_data) column1_changes.$$scope = { changed, ctx };
    			column1.$set(column1_changes);

    			var column2_changes = {};
    			if (changed.$$scope || changed.store_data) column2_changes.$$scope = { changed, ctx };
    			column2.$set(column2_changes);

    			var column3_changes = {};
    			if (changed.$$scope || changed.store_data) column3_changes.$$scope = { changed, ctx };
    			column3.$set(column3_changes);

    			var column4_changes = {};
    			if (changed.$$scope || changed.store_data) column4_changes.$$scope = { changed, ctx };
    			column4.$set(column4_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(vbutton.$$.fragment, local);

    			transition_in(column0.$$.fragment, local);

    			transition_in(column1.$$.fragment, local);

    			transition_in(column2.$$.fragment, local);

    			transition_in(column3.$$.fragment, local);

    			transition_in(column4.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(vbutton.$$.fragment, local);
    			transition_out(column0.$$.fragment, local);
    			transition_out(column1.$$.fragment, local);
    			transition_out(column2.$$.fragment, local);
    			transition_out(column3.$$.fragment, local);
    			transition_out(column4.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(vbutton, );

    			if (detaching) {
    				detach(t0);
    				detach(ul);
    			}

    			destroy_component(column0, );

    			destroy_component(column1, );

    			destroy_component(column2, );

    			destroy_component(column3, );

    			destroy_component(column4, );
    		}
    	};
    }

    // (89:8) {#each store_data.filter(person => person.status === '1') as item, i}
    function create_each_block_5(ctx) {
    	var current;

    	var columnitem = new Index$6({
    		props: {
    		fullName: ctx.item.name.first + ' ' + ctx.item.name.last,
    		imgSrc: ctx.item.picture.large,
    		age: ctx.item.age,
    		email: ctx.item.email,
    		address: ctx.item.location.street
    	},
    		$$inline: true
    	});
    	columnitem.$on("click", remove);

    	return {
    		c: function create_1() {
    			columnitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(columnitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var columnitem_changes = {};
    			if (changed.store_data) columnitem_changes.fullName = ctx.item.name.first + ' ' + ctx.item.name.last;
    			if (changed.store_data) columnitem_changes.imgSrc = ctx.item.picture.large;
    			if (changed.store_data) columnitem_changes.age = ctx.item.age;
    			if (changed.store_data) columnitem_changes.email = ctx.item.email;
    			if (changed.store_data) columnitem_changes.address = ctx.item.location.street;
    			columnitem.$set(columnitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(columnitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(columnitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(columnitem, detaching);
    		}
    	};
    }

    // (88:6) <Column text="Kontakt" accessor="Contact" on:click="{() => showModalAddUser = true}">
    function create_default_slot_6(ctx) {
    	var each_1_anchor, current;

    	var each_value_5 = ctx.store_data.filter(func);

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value_5.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block_5(get_each_context_5(ctx, each_value_5, i_1));
    	}

    	const out = i => transition_out(each_blocks[i], 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create_1() {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.store_data || changed.remove) {
    				each_value_5 = ctx.store_data.filter(func);

    				for (var i_1 = 0; i_1 < each_value_5.length; i_1 += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    						transition_in(each_blocks[i_1], 1);
    					} else {
    						each_blocks[i_1] = create_each_block_5(child_ctx);
    						each_blocks[i_1].c();
    						transition_in(each_blocks[i_1], 1);
    						each_blocks[i_1].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i_1 = each_value_5.length; i_1 < each_blocks.length; i_1 += 1) out(i_1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i_1 = 0; i_1 < each_value_5.length; i_1 += 1) transition_in(each_blocks[i_1]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i_1 = 0; i_1 < each_blocks.length; i_1 += 1) transition_out(each_blocks[i_1]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (100:8) {#each store_data.filter(person => person.status === '2') as item, i}
    function create_each_block_4(ctx) {
    	var current;

    	var columnitem = new Index$6({
    		props: {
    		fullName: ctx.item.name.first + ' ' + ctx.item.name.last,
    		imgSrc: ctx.item.picture.large,
    		age: ctx.item.age,
    		email: ctx.item.email,
    		address: ctx.item.location.street
    	},
    		$$inline: true
    	});
    	columnitem.$on("click", remove);

    	return {
    		c: function create_1() {
    			columnitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(columnitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var columnitem_changes = {};
    			if (changed.store_data) columnitem_changes.fullName = ctx.item.name.first + ' ' + ctx.item.name.last;
    			if (changed.store_data) columnitem_changes.imgSrc = ctx.item.picture.large;
    			if (changed.store_data) columnitem_changes.age = ctx.item.age;
    			if (changed.store_data) columnitem_changes.email = ctx.item.email;
    			if (changed.store_data) columnitem_changes.address = ctx.item.location.street;
    			columnitem.$set(columnitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(columnitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(columnitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(columnitem, detaching);
    		}
    	};
    }

    // (99:6) <Column text="Dialog" accessor="Dialog" on:click="{() => showModalAddUser = true}">
    function create_default_slot_5(ctx) {
    	var each_1_anchor, current;

    	var each_value_4 = ctx.store_data.filter(func_1);

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value_4.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block_4(get_each_context_4(ctx, each_value_4, i_1));
    	}

    	const out = i => transition_out(each_blocks[i], 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create_1() {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.store_data || changed.remove) {
    				each_value_4 = ctx.store_data.filter(func_1);

    				for (var i_1 = 0; i_1 < each_value_4.length; i_1 += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    						transition_in(each_blocks[i_1], 1);
    					} else {
    						each_blocks[i_1] = create_each_block_4(child_ctx);
    						each_blocks[i_1].c();
    						transition_in(each_blocks[i_1], 1);
    						each_blocks[i_1].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i_1 = each_value_4.length; i_1 < each_blocks.length; i_1 += 1) out(i_1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i_1 = 0; i_1 < each_value_4.length; i_1 += 1) transition_in(each_blocks[i_1]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i_1 = 0; i_1 < each_blocks.length; i_1 += 1) transition_out(each_blocks[i_1]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (111:8) {#each store_data.filter(person => person.status === '3') as item, i}
    function create_each_block_3(ctx) {
    	var current;

    	var columnitem = new Index$6({
    		props: {
    		fullName: ctx.item.name.first + ' ' + ctx.item.name.last,
    		imgSrc: ctx.item.picture.large,
    		age: ctx.item.age,
    		email: ctx.item.email,
    		address: ctx.item.location.street
    	},
    		$$inline: true
    	});
    	columnitem.$on("click", remove);

    	return {
    		c: function create_1() {
    			columnitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(columnitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var columnitem_changes = {};
    			if (changed.store_data) columnitem_changes.fullName = ctx.item.name.first + ' ' + ctx.item.name.last;
    			if (changed.store_data) columnitem_changes.imgSrc = ctx.item.picture.large;
    			if (changed.store_data) columnitem_changes.age = ctx.item.age;
    			if (changed.store_data) columnitem_changes.email = ctx.item.email;
    			if (changed.store_data) columnitem_changes.address = ctx.item.location.street;
    			columnitem.$set(columnitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(columnitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(columnitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(columnitem, detaching);
    		}
    	};
    }

    // (110:6) <Column text="Intervju" accessor="Interview" on:click="{() => showModalAddUser = true}">
    function create_default_slot_4(ctx) {
    	var each_1_anchor, current;

    	var each_value_3 = ctx.store_data.filter(func_2);

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value_3.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block_3(get_each_context_3(ctx, each_value_3, i_1));
    	}

    	const out = i => transition_out(each_blocks[i], 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create_1() {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.store_data || changed.remove) {
    				each_value_3 = ctx.store_data.filter(func_2);

    				for (var i_1 = 0; i_1 < each_value_3.length; i_1 += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    						transition_in(each_blocks[i_1], 1);
    					} else {
    						each_blocks[i_1] = create_each_block_3(child_ctx);
    						each_blocks[i_1].c();
    						transition_in(each_blocks[i_1], 1);
    						each_blocks[i_1].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i_1 = each_value_3.length; i_1 < each_blocks.length; i_1 += 1) out(i_1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i_1 = 0; i_1 < each_value_3.length; i_1 += 1) transition_in(each_blocks[i_1]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i_1 = 0; i_1 < each_blocks.length; i_1 += 1) transition_out(each_blocks[i_1]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (122:8) {#each store_data.filter(person => person.status === '4') as item, i}
    function create_each_block_2(ctx) {
    	var current;

    	var columnitem = new Index$6({
    		props: {
    		fullName: ctx.item.name.first + ' ' + ctx.item.name.last,
    		imgSrc: ctx.item.picture.large,
    		age: ctx.item.age,
    		email: ctx.item.email,
    		address: ctx.item.location.street
    	},
    		$$inline: true
    	});
    	columnitem.$on("click", remove);

    	return {
    		c: function create_1() {
    			columnitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(columnitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var columnitem_changes = {};
    			if (changed.store_data) columnitem_changes.fullName = ctx.item.name.first + ' ' + ctx.item.name.last;
    			if (changed.store_data) columnitem_changes.imgSrc = ctx.item.picture.large;
    			if (changed.store_data) columnitem_changes.age = ctx.item.age;
    			if (changed.store_data) columnitem_changes.email = ctx.item.email;
    			if (changed.store_data) columnitem_changes.address = ctx.item.location.street;
    			columnitem.$set(columnitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(columnitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(columnitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(columnitem, detaching);
    		}
    	};
    }

    // (121:6) <Column text="Erbjudande" accessor="Offer" on:click="{() => showModalAddUser = true}">
    function create_default_slot_3(ctx) {
    	var each_1_anchor, current;

    	var each_value_2 = ctx.store_data.filter(func_3);

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value_2.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block_2(get_each_context_2(ctx, each_value_2, i_1));
    	}

    	const out = i => transition_out(each_blocks[i], 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create_1() {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.store_data || changed.remove) {
    				each_value_2 = ctx.store_data.filter(func_3);

    				for (var i_1 = 0; i_1 < each_value_2.length; i_1 += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    						transition_in(each_blocks[i_1], 1);
    					} else {
    						each_blocks[i_1] = create_each_block_2(child_ctx);
    						each_blocks[i_1].c();
    						transition_in(each_blocks[i_1], 1);
    						each_blocks[i_1].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i_1 = each_value_2.length; i_1 < each_blocks.length; i_1 += 1) out(i_1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i_1 = 0; i_1 < each_value_2.length; i_1 += 1) transition_in(each_blocks[i_1]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i_1 = 0; i_1 < each_blocks.length; i_1 += 1) transition_out(each_blocks[i_1]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (133:8) {#each store_data.filter(person => person.status === '5') as item, i}
    function create_each_block_1(ctx) {
    	var current;

    	var columnitem = new Index$6({
    		props: {
    		fullName: ctx.item.name.first + ' ' + ctx.item.name.last,
    		imgSrc: ctx.item.picture.large,
    		age: ctx.item.age,
    		email: ctx.item.email,
    		address: ctx.item.location.street
    	},
    		$$inline: true
    	});
    	columnitem.$on("click", remove);

    	return {
    		c: function create_1() {
    			columnitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(columnitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var columnitem_changes = {};
    			if (changed.store_data) columnitem_changes.fullName = ctx.item.name.first + ' ' + ctx.item.name.last;
    			if (changed.store_data) columnitem_changes.imgSrc = ctx.item.picture.large;
    			if (changed.store_data) columnitem_changes.age = ctx.item.age;
    			if (changed.store_data) columnitem_changes.email = ctx.item.email;
    			if (changed.store_data) columnitem_changes.address = ctx.item.location.street;
    			columnitem.$set(columnitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(columnitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(columnitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(columnitem, detaching);
    		}
    	};
    }

    // (132:6) <Column text="Avslutad" accessor="Completed" on:click="{() => showModalAddUser = true}">
    function create_default_slot_2(ctx) {
    	var each_1_anchor, current;

    	var each_value_1 = ctx.store_data.filter(func_4);

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block_1(get_each_context_1(ctx, each_value_1, i_1));
    	}

    	const out = i => transition_out(each_blocks[i], 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create_1() {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.store_data || changed.remove) {
    				each_value_1 = ctx.store_data.filter(func_4);

    				for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    						transition_in(each_blocks[i_1], 1);
    					} else {
    						each_blocks[i_1] = create_each_block_1(child_ctx);
    						each_blocks[i_1].c();
    						transition_in(each_blocks[i_1], 1);
    						each_blocks[i_1].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i_1 = each_value_1.length; i_1 < each_blocks.length; i_1 += 1) out(i_1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i_1 = 0; i_1 < each_value_1.length; i_1 += 1) transition_in(each_blocks[i_1]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i_1 = 0; i_1 < each_blocks.length; i_1 += 1) transition_out(each_blocks[i_1]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (147:0) {#if showModalAddUser}
    function create_if_block_1(ctx) {
    	var current;

    	var modal = new Index$4({
    		props: {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.close_handler);

    	return {
    		c: function create_1() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var modal_changes = {};
    			if (changed.$$scope || changed.first || changed.last || changed.email || changed.address || changed.status || changed.age) modal_changes.$$scope = { changed, ctx };
    			modal.$set(modal_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (148:1) <Modal on:close="{() => showModalAddUser = false}">
    function create_default_slot_1(ctx) {
    	var updating_valueFirstName, updating_valueLastName, updating_valueAge, updating_valueEmail, updating_valueAddress, updating_selected, current;

    	function adduserform_valueFirstName_binding(value) {
    		ctx.adduserform_valueFirstName_binding.call(null, value);
    		updating_valueFirstName = true;
    		add_flush_callback(() => updating_valueFirstName = false);
    	}

    	function adduserform_valueLastName_binding(value_1) {
    		ctx.adduserform_valueLastName_binding.call(null, value_1);
    		updating_valueLastName = true;
    		add_flush_callback(() => updating_valueLastName = false);
    	}

    	function adduserform_valueAge_binding(value_2) {
    		ctx.adduserform_valueAge_binding.call(null, value_2);
    		updating_valueAge = true;
    		add_flush_callback(() => updating_valueAge = false);
    	}

    	function adduserform_valueEmail_binding(value_3) {
    		ctx.adduserform_valueEmail_binding.call(null, value_3);
    		updating_valueEmail = true;
    		add_flush_callback(() => updating_valueEmail = false);
    	}

    	function adduserform_valueAddress_binding(value_4) {
    		ctx.adduserform_valueAddress_binding.call(null, value_4);
    		updating_valueAddress = true;
    		add_flush_callback(() => updating_valueAddress = false);
    	}

    	function adduserform_selected_binding(value_5) {
    		ctx.adduserform_selected_binding.call(null, value_5);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let adduserform_props = { disabled: !ctx.first || !ctx.last || !ctx.email || !ctx.address || !ctx.status };
    	if (ctx.first !== void 0) {
    		adduserform_props.valueFirstName = ctx.first;
    	}
    	if (ctx.last !== void 0) {
    		adduserform_props.valueLastName = ctx.last;
    	}
    	if (ctx.age !== void 0) {
    		adduserform_props.valueAge = ctx.age;
    	}
    	if (ctx.email !== void 0) {
    		adduserform_props.valueEmail = ctx.email;
    	}
    	if (ctx.address !== void 0) {
    		adduserform_props.valueAddress = ctx.address;
    	}
    	if (ctx.status !== void 0) {
    		adduserform_props.selected = ctx.status;
    	}
    	var adduserform = new Index$b({ props: adduserform_props, $$inline: true });

    	add_binding_callback(() => bind(adduserform, 'valueFirstName', adduserform_valueFirstName_binding));
    	add_binding_callback(() => bind(adduserform, 'valueLastName', adduserform_valueLastName_binding));
    	add_binding_callback(() => bind(adduserform, 'valueAge', adduserform_valueAge_binding));
    	add_binding_callback(() => bind(adduserform, 'valueEmail', adduserform_valueEmail_binding));
    	add_binding_callback(() => bind(adduserform, 'valueAddress', adduserform_valueAddress_binding));
    	add_binding_callback(() => bind(adduserform, 'selected', adduserform_selected_binding));
    	adduserform.$on("click", ctx.create);

    	return {
    		c: function create_1() {
    			adduserform.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(adduserform, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var adduserform_changes = {};
    			if (changed.first || changed.last || changed.email || changed.address || changed.status) adduserform_changes.disabled = !ctx.first || !ctx.last || !ctx.email || !ctx.address || !ctx.status;
    			if (!updating_valueFirstName && changed.first) {
    				adduserform_changes.valueFirstName = ctx.first;
    			}
    			if (!updating_valueLastName && changed.last) {
    				adduserform_changes.valueLastName = ctx.last;
    			}
    			if (!updating_valueAge && changed.age) {
    				adduserform_changes.valueAge = ctx.age;
    			}
    			if (!updating_valueEmail && changed.email) {
    				adduserform_changes.valueEmail = ctx.email;
    			}
    			if (!updating_valueAddress && changed.address) {
    				adduserform_changes.valueAddress = ctx.address;
    			}
    			if (!updating_selected && changed.status) {
    				adduserform_changes.selected = ctx.status;
    			}
    			adduserform.$set(adduserform_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(adduserform.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(adduserform.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(adduserform, detaching);
    		}
    	};
    }

    // (162:0) {#if showModalAllUsers}
    function create_if_block$1(ctx) {
    	var current;

    	var modal = new Index$4({
    		props: {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	modal.$on("close", ctx.close_handler_1);

    	return {
    		c: function create_1() {
    			modal.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var modal_changes = {};
    			if (changed.$$scope || changed.filteredPeople || changed.searchString) modal_changes.$$scope = { changed, ctx };
    			modal.$set(modal_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    // (168:6) {#each filteredPeople as item, i}
    function create_each_block$1(ctx) {
    	var li, t0_value = ctx.item.name.first, t0, t1, t2_value = ctx.item.name.last, t2;

    	return {
    		c: function create_1() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr(li, "class", "svelte-ye0m7i");
    			add_location(li, file$c, 168, 8, 5909);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);
    			append(li, t2);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.filteredPeople) && t0_value !== (t0_value = ctx.item.name.first)) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.filteredPeople) && t2_value !== (t2_value = ctx.item.name.last)) {
    				set_data(t2, t2_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    // (163:1) <Modal on:close="{() => showModalAllUsers = false}">
    function create_default_slot$1(ctx) {
    	var div, h3, t1, updating_value, t2, ul, current;

    	function vinput_value_binding(value) {
    		ctx.vinput_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let vinput_props = {
    		placeholder: "Joe Doe",
    		name: "search",
    		id: "search",
    		type: "text"
    	};
    	if (ctx.searchString !== void 0) {
    		vinput_props.value = ctx.searchString;
    	}
    	var vinput = new Index$7({ props: vinput_props, $$inline: true });

    	add_binding_callback(() => bind(vinput, 'value', vinput_value_binding));

    	var each_value = ctx.filteredPeople;

    	var each_blocks = [];

    	for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    		each_blocks[i_1] = create_each_block$1(get_each_context$1(ctx, each_value, i_1));
    	}

    	return {
    		c: function create_1() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Sök efter person";
    			t1 = space();
    			vinput.$$.fragment.c();
    			t2 = space();
    			ul = element("ul");

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].c();
    			}
    			attr(h3, "class", "svelte-ye0m7i");
    			add_location(h3, file$c, 164, 8, 5717);
    			attr(ul, "class", "svelte-ye0m7i");
    			add_location(ul, file$c, 166, 6, 5854);
    			attr(div, "class", "user__wrapper svelte-ye0m7i");
    			add_location(div, file$c, 163, 4, 5680);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h3);
    			append(div, t1);
    			mount_component(vinput, div, null);
    			append(div, t2);
    			append(div, ul);

    			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
    				each_blocks[i_1].m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var vinput_changes = {};
    			if (!updating_value && changed.searchString) {
    				vinput_changes.value = ctx.searchString;
    			}
    			vinput.$set(vinput_changes);

    			if (changed.filteredPeople) {
    				each_value = ctx.filteredPeople;

    				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i_1);

    					if (each_blocks[i_1]) {
    						each_blocks[i_1].p(changed, child_ctx);
    					} else {
    						each_blocks[i_1] = create_each_block$1(child_ctx);
    						each_blocks[i_1].c();
    						each_blocks[i_1].m(ul, null);
    					}
    				}

    				for (; i_1 < each_blocks.length; i_1 += 1) {
    					each_blocks[i_1].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(vinput.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(vinput.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(vinput, );

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$c(ctx) {
    	var div, current_block_type_index, if_block0, t0, t1, current;

    	var if_block_creators = [
    		create_if_block_2,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.store_data) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	var if_block1 = (ctx.showModalAddUser) && create_if_block_1(ctx);

    	var if_block2 = (ctx.showModalAllUsers) && create_if_block$1(ctx);

    	return {
    		c: function create_1() {
    			div = element("div");
    			if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr(div, "class", "container");
    			add_location(div, file$c, 78, 0, 2541);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block0 = if_blocks[current_block_type_index];
    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}
    				transition_in(if_block0, 1);
    				if_block0.m(div, t0);
    			}

    			if (ctx.showModalAddUser) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			if (ctx.showModalAllUsers) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				}
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};
    }

    function remove(e){
      //TODO: Remove item from array...
      e.target.parentElement.parentElement.parentElement.remove();
    }

    function func(person) {
    	return person.status === '1';
    }

    function func_1(person) {
    	return person.status === '2';
    }

    function func_2(person) {
    	return person.status === '3';
    }

    function func_3(person) {
    	return person.status === '4';
    }

    function func_4(person) {
    	return person.status === '5';
    }

    function instance$c($$self, $$props, $$invalidate) {
    	
      let persons = fakeData.results;
      let showModalAddUser = false;
      let showModalAllUsers = false;
      let searchString = '';
      let first = '';
      let last = '';
      let age = '';
      let email = '';
      let address = '';
      let status = '';
      let store_data;

      const unsubscribe = data.subscribe(value => {
        console.log(value);
        $$invalidate('store_data', store_data = value.results);
      });
      onMount(() => {
        dragula_1([
          document.getElementById("Contact"),
          document.getElementById("Dialog"),
          document.getElementById("Interview"),
          document.getElementById("Offer"),
    	    document.getElementById("Completed"),
        ])
          .on("drag", el => {
            el.classList.add("is-moving");
          })
          .on("dragend", el => {
            el.classList.remove("is-moving");
            window.setTimeout(() => {
              el.classList.add("is-moved");
              window.setTimeout(() => {
                el.classList.remove("is-moved");
              }, 600);
            }, 100);
          });
      });
      function create() {
        $$invalidate('persons', persons = persons.concat({ name:{first, last}, email, location:{street:address}, age, status, picture:{large:"https://randomuser.me/api/portraits/men/24.jpg"} }));
    		 //i = persons.length - 1;
         $$invalidate('first', first = last =  email = address = status = ''); $$invalidate('status', status); $$invalidate('address', address); $$invalidate('email', email); $$invalidate('last', last);
         $$invalidate('showModalAddUser', showModalAddUser = false);
      }

    	function click_handler() {
    		const $$result = showModalAllUsers = true;
    		$$invalidate('showModalAllUsers', showModalAllUsers);
    		return $$result;
    	}

    	function click_handler_1() {
    		const $$result = showModalAddUser = true;
    		$$invalidate('showModalAddUser', showModalAddUser);
    		return $$result;
    	}

    	function click_handler_2() {
    		const $$result = showModalAddUser = true;
    		$$invalidate('showModalAddUser', showModalAddUser);
    		return $$result;
    	}

    	function click_handler_3() {
    		const $$result = showModalAddUser = true;
    		$$invalidate('showModalAddUser', showModalAddUser);
    		return $$result;
    	}

    	function click_handler_4() {
    		const $$result = showModalAddUser = true;
    		$$invalidate('showModalAddUser', showModalAddUser);
    		return $$result;
    	}

    	function click_handler_5() {
    		const $$result = showModalAddUser = true;
    		$$invalidate('showModalAddUser', showModalAddUser);
    		return $$result;
    	}

    	function adduserform_valueFirstName_binding(value) {
    		first = value;
    		$$invalidate('first', first);
    	}

    	function adduserform_valueLastName_binding(value_1) {
    		last = value_1;
    		$$invalidate('last', last);
    	}

    	function adduserform_valueAge_binding(value_2) {
    		age = value_2;
    		$$invalidate('age', age);
    	}

    	function adduserform_valueEmail_binding(value_3) {
    		email = value_3;
    		$$invalidate('email', email);
    	}

    	function adduserform_valueAddress_binding(value_4) {
    		address = value_4;
    		$$invalidate('address', address);
    	}

    	function adduserform_selected_binding(value_5) {
    		status = value_5;
    		$$invalidate('status', status);
    	}

    	function close_handler() {
    		const $$result = showModalAddUser = false;
    		$$invalidate('showModalAddUser', showModalAddUser);
    		return $$result;
    	}

    	function vinput_value_binding(value) {
    		searchString = value;
    		$$invalidate('searchString', searchString);
    	}

    	function close_handler_1() {
    		const $$result = showModalAllUsers = false;
    		$$invalidate('showModalAllUsers', showModalAllUsers);
    		return $$result;
    	}

    	let filteredPeople;

    	$$self.$$.update = ($$dirty = { searchString: 1, persons: 1 }) => {
    		if ($$dirty.searchString || $$dirty.persons) { $$invalidate('filteredPeople', filteredPeople = searchString
              ? persons.filter(person => {
                const name = `${person.name.first}, ${person.name.last}`;
                return name.toLowerCase().startsWith(searchString.toLowerCase());
              })
            : persons); }
    	};

    	return {
    		showModalAddUser,
    		showModalAllUsers,
    		searchString,
    		first,
    		last,
    		age,
    		email,
    		address,
    		status,
    		store_data,
    		create,
    		filteredPeople,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		adduserform_valueFirstName_binding,
    		adduserform_valueLastName_binding,
    		adduserform_valueAge_binding,
    		adduserform_valueEmail_binding,
    		adduserform_valueAddress_binding,
    		adduserform_selected_binding,
    		close_handler,
    		vinput_value_binding,
    		close_handler_1
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, []);
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
