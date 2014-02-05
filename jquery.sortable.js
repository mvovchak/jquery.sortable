(function ($, window, document) {

	var pluginName = "sortable",
		elementData = "plugin_" + pluginName,
		draggingElement = null,
		defaults = {
			placeholder: "sortable-placeholder",
			dragging: "sortable-dragging",
			dropped: "sortable-dropped",
			handle: null
		},
		eventNames = {
			mousedown: "mousedown.sortable",
			mouseup: "mouseup.sortable",
			dragstart: "dragstart.sortable",
			dragend: "dragend.sortable",
			selectstart: "selectstart.sortable",
			drop: "drop.sortable",
			dragover: "dragover.sortable dragenter.sortable",
			sortupdate: "sortupdate.sortable"
		};

	function Sortable(element, options) {
		this.element = $(element);
		this.settings = $.extend({}, defaults, options || {});
		this._name = pluginName;
		this.isTable = false;
		this.isHandle = false
		this.placeholder = null;
		this.itemIndex = 0;
		this.items = $();

		this.init();
	}

	Sortable.prototype.init = function () {
		setPlaceholder.call(this);
		setItems.call(this);
		initEvents.call(this);
	};

	Sortable.prototype.destroy = function () {
		this.placeholder.remove();
		this.placeholder = null;
		draggingElement = null;
		this.element.off(".sortable");
		this.items.off(".sortable");
		this.element.removeData(elementData);
	};

	// Create draggable placeholder
	function setPlaceholder() {
		var tagName = this.element.prop("tagName").toLowerCase(),
			rowContainer,
			placeHolderTag;

		if (tagName === "table") {
			placeHolderTag = "tr";
			rowContainer = $("<td />", {
				"colspan": this.element.find("tr:first td,th").length,
				"class": this.settings.placeholder
			});

			this.isTable = true;

		} else if (/^ul|ol$/i.test(tagName)) {
			placeHolderTag = "li";
		} else {
			placeHolderTag = "div";
		}
		this.placeholder = $("<" + placeHolderTag + " />").addClass(this.settings.placeholder).append(rowContainer);
	}

	// Set element children (usually li/table rows)
	function setItems() {
		this.items = this.isTable ? this.element.find("tbody > tr") : this.element.children();
		this.items.prop("draggable", true);
	}

	// init events
	function initEvents() {
		var self = this,
			items = this.items,
			placeholder = this.placeholder;

		createEventListener(eventNames.mousedown, items.find(self.settings.handle), self, function () {
			this.isHandle = true;
		});
		createEventListener(eventNames.mouseup, items, self, function () {
			this.isHandle = false;
		});
		createEventListener(eventNames.dragend, items, self, onDragEnd);
		createEventListener(eventNames.selectstart, items.not("a[href],img"), self, onSelectStart);
		createEventListener(eventNames.dragstart, [items, placeholder], self, onDragStart);
		createEventListener(eventNames.drop, [items, placeholder], self, onDrop);
		createEventListener(eventNames.dragover, [items, placeholder], self, onDragOver);
	}

	function onDragStart(e, element) {
		if (this.settings.handle && !this.isHandle) {
			return false;
		}
		setDataTransfer(e, true);
		draggingElement = element.addClass(this.settings.dragging);
		this.isHandle = false;
		this.itemIndex = draggingElement.index();
	}

	function onDragEnd(e, element) {
		if (!draggingElement) {
			return false;
		}

		draggingElement.removeClass(this.settings.dragging);
		draggingElement.show();
		this.placeholder.detach();

		if (this.itemIndex != draggingElement.index()) {
			this.element.trigger(eventNames.sortupdate, {
				item: draggingElement
			});
		}
		draggingElement = $();
	}

	function onDrop(e, element) {
		e.stopPropagation();
		this.placeholder.after(draggingElement);
		draggingElement.trigger(eventNames.dragend);
		return false;
	}

	function onDragOver(e, element) {
		if (!this.items.is(draggingElement)) {
			return true;
		}
		e.preventDefault();
		setDataTransfer(e);

		draggingElement.hide();

		if (this.items.is(element[0])) {
			element[this.itemIndex < this.placeholder.index() ? "after" : "before"](this.placeholder);
		}
		return false;
	}

	function onSelectStart(e, element) {
		return element.dragDrop ? element.dragDrop() : false; // IE fix
	}

	function createEventListener(eventType, targetElement, context, callback) {
		var i = 0,
			addEvent = function (el) {
				el.on(eventType, function (e) {
					callback.call(context, e, $(this));
				});
			};
		if ($.isArray(targetElement)) {
			i = targetElement.length;
			while (i--) {
				addEvent(targetElement[i]);
			}
		} else {
			addEvent(targetElement);
		}
	}

	function setDataTransfer(e, isInit) {
		var dt = e.originalEvent.dataTransfer;
		if (isInit) {
			dt.effectAllowed = "move";
			dt.setData("text", "dummyText");
		} else {
			dt.dropEffect = "move";
		}
	}

	$.fn[pluginName] = function (options) {
		this.each(function () {
			if (!$.data(this, elementData) && options != "destroy") {
				$.data(this, elementData, new Sortable(this, options));
			} else if (options === "destroy") {
				$.data(this, elementData).destroy();
			}
		});

		return this;
	};

})(jQuery, window, document);