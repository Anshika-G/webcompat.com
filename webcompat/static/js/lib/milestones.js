/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var issues = issues || {}; // eslint-disable-line no-use-before-define

issues.MilestonesView = issues.CategoryView.extend({
  el: $(".js-Issue-milestones"),
  keyboardEvents: {
    m: "openMilestoneEditor"
  },
  template: wcTmpl["issue/issue-milestones.jst"],
  // this subTemplate will need to be kept in sync with
  // relavant parts in issue/issue-labels.jst
  subTemplate: wcTmpl["issue/issue-milestones-sub.jst"],
  openMilestoneEditor: function(e) {
    // make sure we're not typing in the search input.
    if (e.target.nodeName === "TEXTAREA") {
      return;
    } else {
      e.preventDefault();
      this.editItems();
    }
  },
  closeEditor: function() {
    this.milestoneEditor.closeEditor();
  },
  fetchItems: function() {
    this.editorButton = $(".js-MilestoneEditorLauncher");
    this.milestoneEditor = new issues.MilestoneEditorView({
      model: new issues.MilestonesModel({
        statuses: $("main").data("statuses")
      }),
      issueView: this
    });
    if (this._isLoggedIn) {
      this.editorButton.show();
    }
  },
  editItems: function() {
    this.editorButton.addClass("is-active");
    this.$el
      .find(".js-MilestoneEditorLauncher")
      .after(this.milestoneEditor.render().el);

    $('[name="' + this.model.get("milestone") + '"]').prop("checked", true);
  }
});

issues.MilestoneEditorView = issues.CategoryEditorView.extend({
  initialize: function(options) {
    this.issueView = options.issueView;
  },
  template: wcTmpl["web_modules/milestone-editor.jst"],
  updateView: function(evt) {
    // We try to make sure only one milestone is set
    // enumerate all checked milestones and uncheck the others.
    var checked = $(
      'input[type=checkbox][data-remotename^="milestone"]:checked'
    );
    _.each(checked, function(item) {
      if (item !== evt.target) {
        item.checked = false;
      }
    });
    checked = $("input[type=checkbox]:checked");
    // we do the "real" save when you close the editor.
    // this just updates the UI responsively
    this.reRender({ name: checked.prop("name"), color: checked.data("color") });
  },
  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    this.resizeEditorHeight();
    _.defer(
      _.bind(function() {
        this.$el.find(".wc-CategoryEditor-search").focus();
      }, this)
    );
    return this;
  },
  closeEditor: function(e) {
    if (!e || (e && (e.keyCode === 27 || !e.keyCode))) {
      var checked = $("input[type=checkbox]:checked").prop("name");
      var statusObject = _.find(this.model.get("milestones"), function(status) {
        return status.name === checked;
      });

      // Don't bother to update the server if nothing changed.
      if (checked !== this.issueView.model.get("milestone")) {
        this.model.updateMilestones({
          milestone: statusObject.id,
          state: statusObject.state
        });
      }

      // detach() (vs remove()) here because we don't want to lose events if the
      // user reopens the editor.
      this.$el.children().detach();
      this.issueView.editorButton.removeClass("is-active");
    }
  }
});