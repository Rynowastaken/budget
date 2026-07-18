package com.ryno.financemanager;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final String PREFS_NAME = "finance-manager";
    private static final String SERVER_URL_KEY = "serverUrl";
    private static final String SERVER_HISTORY_KEY = "serverHistory";
    private static final int FILE_CHOOSER_REQUEST = 42;

    private SharedPreferences prefs;
    private FrameLayout root;
    private WebView webView;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> filePathCallback;
    private String currentServerUrl = "";
    private String pendingServerTitle = "";
    private String pendingReplaceServerUrl = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        root = new FrameLayout(this);
        setContentView(root);

        String savedServer = prefs.getString(SERVER_URL_KEY, "");
        if (savedServer.isEmpty()) {
            showSetup("", "", "");
        } else {
            showWebApp(savedServer, titleForServer(savedServer));
        }
    }

    private void showSetup(String message, String suggestedServer, String suggestedTitle) {
        showSetup(message, suggestedServer, suggestedTitle, "", false);
    }

    private void showSetup(String message, String suggestedServer, String suggestedTitle, String editingServerUrl) {
        showSetup(message, suggestedServer, suggestedTitle, editingServerUrl, true);
    }

    private void showSetup(String message, String suggestedServer, String suggestedTitle, String editingServerUrl, boolean forceFormOpen) {
        root.removeAllViews();
        currentServerUrl = "";
        pendingServerTitle = "";
        pendingReplaceServerUrl = "";
        UiColors colors = uiColors();
        applySystemBars(colors);
        List<ServerEntry> servers = getServerHistory();
        boolean isEditing = !normalizeServerUrl(editingServerUrl).isEmpty();
        boolean showForm = forceFormOpen || isEditing || servers.isEmpty();

        ScrollView scroller = new ScrollView(this);
        scroller.setFillViewport(true);
        scroller.setBackground(makeBackground(colors));

        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setGravity(Gravity.CENTER);
        page.setPadding(dp(20), dp(56), dp(20), dp(32));

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(20), dp(20), dp(20), dp(20));
        card.setBackground(makeGlassBackground(dp(22), colors.surface, colors.outline));

        TextView title = new TextView(this);
        title.setText(isEditing ? "Edit server" : "Servers");
        title.setTextColor(colors.onSurface);
        title.setTextSize(24);
        title.setTypeface(Typeface.DEFAULT_BOLD);

        TextView subtitle = new TextView(this);
        subtitle.setText(showForm ? "Enter a server title and address." : "Choose a saved server or add a new one.");
        subtitle.setTextColor(colors.onSurfaceVariant);
        subtitle.setTextSize(14);
        subtitle.setPadding(0, dp(8), 0, dp(18));

        TextView status = new TextView(this);
        status.setText(message);
        status.setTextColor(colors.error);
        status.setTextSize(14);
        status.setTypeface(Typeface.DEFAULT_BOLD);
        status.setVisibility(message.isEmpty() ? View.GONE : View.VISIBLE);
        status.setPadding(0, 0, 0, dp(12));

        TextView addServer = makeActionButton("Add server", true, R.drawable.ic_server, colors);
        addServer.setVisibility(showForm ? View.GONE : View.VISIBLE);
        addServer.setOnClickListener((view) -> showSetup("", "", "", "", true));

        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setHint("http://192.168.0.95:4173");
        input.setTextColor(colors.onSurface);
        input.setHintTextColor(colors.onSurfaceVariant);
        input.setText(!suggestedServer.isEmpty() ? suggestedServer : prefs.getString(SERVER_URL_KEY, ""));
        input.setSelectAllOnFocus(false);
        input.setInputType(android.text.InputType.TYPE_TEXT_VARIATION_URI);
        styleSetupInput(input, colors);

        EditText titleInput = new EditText(this);
        titleInput.setSingleLine(true);
        titleInput.setHint("Home server");
        titleInput.setTextColor(colors.onSurface);
        titleInput.setHintTextColor(colors.onSurfaceVariant);
        titleInput.setText(!suggestedTitle.isEmpty() ? suggestedTitle : titleForServer(input.getText().toString()));
        titleInput.setSelectAllOnFocus(false);
        titleInput.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        styleSetupInput(titleInput, colors);

        TextView save = makeActionButton("Save", false, R.drawable.ic_save, colors);
        save.setVisibility(isEditing ? View.VISIBLE : View.GONE);
        save.setOnClickListener((view) -> {
            String normalized = normalizeServerUrl(input.getText().toString());
            if (normalized.isEmpty()) {
                input.setError("Enter a server address");
                return;
            }
            hideKeyboard(input);
            saveEditedServer(editingServerUrl, normalized, titleInput.getText().toString());
            showSetup("Saved server updated.", normalized, titleInput.getText().toString());
        });

        TextView connect = makeActionButton(isEditing ? "Save and connect" : "Connect", true, R.drawable.ic_login, colors);
        connect.setOnClickListener((view) -> {
            String normalized = normalizeServerUrl(input.getText().toString());
            if (normalized.isEmpty()) {
                input.setError("Enter a server address");
                return;
            }
            hideKeyboard(input);
            showWebApp(normalized, titleInput.getText().toString(), editingServerUrl);
        });

        TextView clearCache = makeActionButton("Clear cache", false, R.drawable.ic_trash, colors);
        clearCache.setOnClickListener((view) -> {
            clearWebCache();
            showSetup("Cached website files cleared.", input.getText().toString(), titleInput.getText().toString(), editingServerUrl, showForm);
        });

        LinearLayout.LayoutParams fullWidth = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        fullWidth.setMargins(0, dp(8), 0, dp(8));

        card.addView(title, fullWidth);
        card.addView(subtitle, fullWidth);
        card.addView(status, fullWidth);
        card.addView(addServer, fullWidth);
        TextView titleLabel = makeFieldLabel("Server title");
        titleLabel.setVisibility(showForm ? View.VISIBLE : View.GONE);
        card.addView(titleLabel, fullWidth);
        titleInput.setVisibility(showForm ? View.VISIBLE : View.GONE);
        card.addView(titleInput, fullWidth);
        TextView addressLabel = makeFieldLabel("Server address");
        addressLabel.setVisibility(showForm ? View.VISIBLE : View.GONE);
        card.addView(addressLabel, fullWidth);
        input.setVisibility(showForm ? View.VISIBLE : View.GONE);
        card.addView(input, fullWidth);
        save.setVisibility(showForm && isEditing ? View.VISIBLE : View.GONE);
        card.addView(save, fullWidth);
        connect.setVisibility(showForm ? View.VISIBLE : View.GONE);
        card.addView(connect, fullWidth);
        card.addView(clearCache, fullWidth);

        if (!servers.isEmpty()) {
            TextView recentTitle = new TextView(this);
            recentTitle.setText("Saved servers");
            recentTitle.setTextColor(colors.onSurfaceVariant);
            recentTitle.setTextSize(13);
            recentTitle.setTypeface(Typeface.DEFAULT_BOLD);
            recentTitle.setPadding(0, dp(16), 0, dp(2));
            card.addView(recentTitle, fullWidth);

            for (ServerEntry server : servers) {
                LinearLayout serverButton = makeServerButton(server, colors);
                serverButton.setOnClickListener((view) -> {
                    input.setText(server.url);
                    titleInput.setText(server.title);
                    showWebApp(server.url, server.title);
                });
                View editButton = serverButton.findViewWithTag("edit-server");
                editButton.setOnClickListener((view) -> {
                    input.setText(server.url);
                    titleInput.setText(server.title);
                    showSetup("Edit the saved server, then save or connect.", server.url, server.title, server.url);
                });
                View deleteButton = serverButton.findViewWithTag("delete-server");
                deleteButton.setOnClickListener((view) -> {
                    deleteSavedServer(server.url);
                    String currentAddress = normalizeServerUrl(input.getText().toString());
                    String nextAddress = currentAddress.equals(server.url) ? "" : input.getText().toString();
                    String nextTitle = currentAddress.equals(server.url) ? "" : titleInput.getText().toString();
                    showSetup("Saved server removed.", nextAddress, nextTitle, "", false);
                });
                card.addView(serverButton, fullWidth);
            }
        }

        page.addView(card, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        scroller.addView(page, new ScrollView.LayoutParams(
            ScrollView.LayoutParams.MATCH_PARENT,
            ScrollView.LayoutParams.MATCH_PARENT
        ));
        root.addView(scroller, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));
    }

    private void showWebApp(String serverUrl, String serverTitle) {
        showWebApp(serverUrl, serverTitle, "");
    }

    private void showWebApp(String serverUrl, String serverTitle, String replaceServerUrl) {
        root.removeAllViews();
        getWindow().setStatusBarColor(Color.rgb(21, 16, 24));
        getWindow().setNavigationBarColor(Color.rgb(21, 16, 24));
        getWindow().getDecorView().setSystemUiVisibility(0);
        currentServerUrl = serverUrl;
        pendingServerTitle = normalizeTitle(serverTitle, serverUrl);
        pendingReplaceServerUrl = normalizeServerUrl(replaceServerUrl);

        webView = new WebView(this);
        progressBar = new ProgressBar(this);
        progressBar.setIndeterminate(true);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webView.addJavascriptInterface(new AndroidBridge(), "FinanceManagerAndroid");
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (ActivityNotFoundException error) {
                    MainActivity.this.filePathCallback = null;
                    Toast.makeText(MainActivity.this, "No file picker available.", Toast.LENGTH_LONG).show();
                    return false;
                }
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                if (!pendingReplaceServerUrl.isEmpty() && !pendingReplaceServerUrl.equals(serverUrl)) {
                    deleteSavedServer(pendingReplaceServerUrl);
                    pendingReplaceServerUrl = "";
                }
                saveSuccessfulServer(serverUrl, pendingServerTitle);
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                progressBar.setVisibility(View.GONE);
                if (failingUrl != null && failingUrl.startsWith(serverUrl)) {
                    Toast.makeText(MainActivity.this, "Could not load server.", Toast.LENGTH_LONG).show();
                    showSetup("Could not connect. Switch server or try another address.", serverUrl, pendingServerTitle);
                }
            }
        });

        root.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));

        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(dp(48), dp(48));
        progressParams.gravity = Gravity.CENTER;
        root.addView(progressBar, progressParams);

        webView.loadUrl(serverUrl);
    }

    private void clearServerAndShowSetup() {
        prefs.edit().remove(SERVER_URL_KEY).apply();
        if (webView != null) {
            webView.clearHistory();
            webView.clearFormData();
            webView.destroy();
            webView = null;
        }
        showSetup("", currentServerUrl, titleForServer(currentServerUrl));
    }

    private void clearWebCache() {
        WebView cacheView = webView != null ? webView : new WebView(this);
        cacheView.clearCache(true);
        if (cacheView != webView) {
            cacheView.destroy();
        }
        Toast.makeText(this, "Cache cleared.", Toast.LENGTH_SHORT).show();
    }

    private String normalizeServerUrl(String value) {
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return "";
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            trimmed = "http://" + trimmed;
        }
        Uri uri = Uri.parse(trimmed);
        if (uri.getHost() == null) return "";
        return trimmed.endsWith("/") ? trimmed : trimmed + "/";
    }

    private void hideKeyboard(View view) {
        InputMethodManager manager = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
        if (manager != null) {
            manager.hideSoftInputFromWindow(view.getWindowToken(), 0);
        }
    }

    private void saveSuccessfulServer(String serverUrl, String serverTitle) {
        if (serverUrl == null || serverUrl.isEmpty()) return;
        ServerEntry next = new ServerEntry(normalizeTitle(serverTitle, serverUrl), serverUrl);
        List<ServerEntry> servers = getServerHistory();
        servers.removeIf((server) -> server.url.equals(serverUrl));
        servers.add(0, next);
        while (servers.size() > 5) {
            servers.remove(servers.size() - 1);
        }
        prefs.edit()
            .putString(SERVER_URL_KEY, serverUrl)
            .putString(SERVER_HISTORY_KEY, serializeServerHistory(servers))
            .apply();
    }

    private void deleteSavedServer(String serverUrl) {
        String normalized = normalizeServerUrl(serverUrl);
        if (normalized.isEmpty()) return;
        List<ServerEntry> servers = getServerHistory();
        servers.removeIf((server) -> server.url.equals(normalized));

        SharedPreferences.Editor editor = prefs.edit()
            .putString(SERVER_HISTORY_KEY, serializeServerHistory(servers));
        if (normalizeServerUrl(prefs.getString(SERVER_URL_KEY, "")).equals(normalized)) {
            editor.remove(SERVER_URL_KEY);
        }
        editor.apply();
    }

    private void saveEditedServer(String previousServerUrl, String serverUrl, String serverTitle) {
        String previous = normalizeServerUrl(previousServerUrl);
        String normalized = normalizeServerUrl(serverUrl);
        if (normalized.isEmpty()) return;

        ServerEntry edited = new ServerEntry(normalizeTitle(serverTitle, normalized), normalized);
        List<ServerEntry> servers = getServerHistory();
        servers.removeIf((server) -> server.url.equals(previous) || server.url.equals(normalized));
        servers.add(0, edited);
        while (servers.size() > 5) {
            servers.remove(servers.size() - 1);
        }

        SharedPreferences.Editor editor = prefs.edit()
            .putString(SERVER_HISTORY_KEY, serializeServerHistory(servers));
        String saved = normalizeServerUrl(prefs.getString(SERVER_URL_KEY, ""));
        if (saved.equals(previous) || saved.equals(normalized)) {
            editor.putString(SERVER_URL_KEY, normalized);
        }
        editor.apply();
    }

    private List<ServerEntry> getServerHistory() {
        String raw = prefs.getString(SERVER_HISTORY_KEY, "");
        List<ServerEntry> servers = new ArrayList<>();
        if (!raw.isEmpty()) {
            for (String entry : raw.split("\n")) {
                ServerEntry server = parseServerEntry(entry);
                if (!server.url.isEmpty() && findServer(servers, server.url) == null) {
                    servers.add(server);
                }
            }
        }
        String saved = normalizeServerUrl(prefs.getString(SERVER_URL_KEY, ""));
        if (!saved.isEmpty() && findServer(servers, saved) == null) {
            servers.add(0, new ServerEntry(defaultTitleForServer(saved), saved));
        }
        return servers;
    }

    private String serializeServerHistory(List<ServerEntry> servers) {
        List<String> lines = new ArrayList<>();
        for (ServerEntry server : servers) {
            lines.add(escapeHistoryField(server.title) + "\t" + escapeHistoryField(server.url));
        }
        return String.join("\n", lines);
    }

    private ServerEntry parseServerEntry(String entry) {
        String[] parts = entry.split("\t", 2);
        if (parts.length == 2) {
            String url = normalizeServerUrl(unescapeHistoryField(parts[1]));
            return new ServerEntry(normalizeTitle(unescapeHistoryField(parts[0]), url), url);
        }
        String url = normalizeServerUrl(entry);
        return new ServerEntry(defaultTitleForServer(url), url);
    }

    private String escapeHistoryField(String value) {
        return String.valueOf(value).replace("\\", "\\\\").replace("\t", "\\t").replace("\n", "\\n");
    }

    private String unescapeHistoryField(String value) {
        return value.replace("\\n", "\n").replace("\\t", "\t").replace("\\\\", "\\");
    }

    private ServerEntry findServer(List<ServerEntry> servers, String url) {
        for (ServerEntry server : servers) {
            if (server.url.equals(url)) return server;
        }
        return null;
    }

    private String titleForServer(String serverUrl) {
        String normalized = normalizeServerUrl(serverUrl);
        ServerEntry server = findServer(getServerHistory(), normalized);
        return server != null ? server.title : defaultTitleForServer(normalized);
    }

    private String normalizeTitle(String title, String serverUrl) {
        String trimmed = title == null ? "" : title.trim();
        return trimmed.isEmpty() ? defaultTitleForServer(serverUrl) : trimmed;
    }

    private String defaultTitleForServer(String serverUrl) {
        Uri uri = Uri.parse(normalizeServerUrl(serverUrl));
        String host = uri.getHost();
        return host == null || host.isEmpty() ? "Finance server" : host;
    }

    private TextView makeActionButton(String text, boolean primary) {
        return makeActionButton(text, primary, primary ? R.drawable.ic_login : R.drawable.ic_server, uiColors());
    }

    private TextView makeActionButton(String text, boolean primary, int iconRes) {
        return makeActionButton(text, primary, iconRes, uiColors());
    }

    private TextView makeActionButton(String text, boolean primary, int iconRes, UiColors colors) {
        TextView button = new TextView(this);
        button.setText(text);
        button.setTextSize(15);
        button.setTypeface(Typeface.DEFAULT_BOLD);
        button.setGravity(Gravity.CENTER);
        button.setMinHeight(dp(48));
        button.setPadding(dp(18), 0, dp(18), 0);
        button.setTextColor(primary ? colors.onPrimary : colors.primary);
        int fill = primary ? colors.primary : colors.surfaceVariant;
        int stroke = primary ? colors.primary : colors.outline;
        button.setBackground(makeGlassBackground(dp(18), fill, stroke));
        button.setCompoundDrawablesWithIntrinsicBounds(iconRes, 0, 0, 0);
        for (android.graphics.drawable.Drawable drawable : button.getCompoundDrawables()) {
            if (drawable != null) drawable.setTint(button.getCurrentTextColor());
        }
        button.setCompoundDrawablePadding(dp(8));
        return button;
    }

    private TextView makeFieldLabel(String text) {
        UiColors colors = uiColors();
        TextView label = new TextView(this);
        label.setText(text);
        label.setTextColor(colors.onSurfaceVariant);
        label.setTextSize(13);
        label.setTypeface(Typeface.DEFAULT_BOLD);
        label.setPadding(0, dp(8), 0, 0);
        return label;
    }

    private void styleSetupInput(EditText input, UiColors colors) {
        input.setTextSize(15);
        input.setGravity(Gravity.CENTER_VERTICAL);
        input.setMinHeight(dp(54));
        input.setIncludeFontPadding(false);
        input.setPadding(dp(16), 0, dp(16), 0);
        input.setBackground(makeGlassBackground(dp(14), colors.surfaceVariant, colors.outline));
    }

    private LinearLayout makeServerButton(ServerEntry server, UiColors colors) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setMinimumHeight(dp(64));
        row.setPadding(dp(14), dp(10), dp(14), dp(10));
        row.setBackground(makeGlassBackground(dp(18), colors.surfaceVariant, colors.outline));

        ImageView icon = new ImageView(this);
        icon.setImageResource(R.drawable.ic_server);
        icon.setColorFilter(colors.primary);
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(dp(24), dp(24));
        iconParams.setMargins(0, 0, dp(12), 0);
        row.addView(icon, iconParams);

        LinearLayout textStack = new LinearLayout(this);
        textStack.setOrientation(LinearLayout.VERTICAL);

        TextView title = new TextView(this);
        title.setText(server.title);
        title.setTextColor(colors.onSurface);
        title.setTextSize(15);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setSingleLine(true);

        TextView url = new TextView(this);
        url.setText(server.url);
        url.setTextColor(colors.onSurfaceVariant);
        url.setTextSize(12);
        url.setSingleLine(true);

        textStack.addView(title);
        textStack.addView(url);
        row.addView(textStack, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        ImageView edit = new ImageView(this);
        edit.setTag("edit-server");
        edit.setContentDescription("Edit saved server");
        edit.setImageResource(R.drawable.ic_edit);
        edit.setColorFilter(colors.primary);
        edit.setPadding(dp(10), dp(10), dp(10), dp(10));
        edit.setBackground(makeGlassBackground(dp(14), colors.surface, colors.outline));
        LinearLayout.LayoutParams editParams = new LinearLayout.LayoutParams(dp(44), dp(44));
        editParams.setMargins(dp(12), 0, 0, 0);
        row.addView(edit, editParams);

        ImageView delete = new ImageView(this);
        delete.setTag("delete-server");
        delete.setContentDescription("Delete saved server");
        delete.setImageResource(R.drawable.ic_trash);
        delete.setColorFilter(colors.error);
        delete.setPadding(dp(10), dp(10), dp(10), dp(10));
        delete.setBackground(makeGlassBackground(dp(14), colors.surface, colors.outline));
        LinearLayout.LayoutParams deleteParams = new LinearLayout.LayoutParams(dp(44), dp(44));
        deleteParams.setMargins(dp(12), 0, 0, 0);
        row.addView(delete, deleteParams);
        return row;
    }

    private static class ServerEntry {
        final String title;
        final String url;

        ServerEntry(String title, String url) {
            this.title = title;
            this.url = url;
        }
    }

    private GradientDrawable makeGlassBackground(int radius, int fill, int stroke) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(fill);
        drawable.setCornerRadius(radius);
        drawable.setStroke(dp(1), stroke);
        return drawable;
    }

    private GradientDrawable makeBackground(UiColors colors) {
        return new GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            new int[] { colors.background, colors.surface, colors.background }
        );
    }

    private UiColors uiColors() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            int primary = systemColor("system_accent1_600", Color.rgb(103, 80, 164));
            return new UiColors(
                systemColor("system_neutral1_10", Color.rgb(255, 251, 254)),
                systemColor("system_neutral1_10", Color.rgb(255, 251, 254)),
                systemColor("system_neutral2_100", Color.rgb(231, 224, 236)),
                systemColor("system_neutral1_900", Color.rgb(29, 27, 32)),
                systemColor("system_neutral2_700", Color.rgb(73, 69, 79)),
                primary,
                readableText(primary),
                systemColor("system_neutral2_300", Color.rgb(121, 116, 126)),
                Color.rgb(186, 26, 26)
            );
        }

        int primary = Color.rgb(103, 80, 164);
        return new UiColors(
            Color.rgb(255, 251, 254),
            Color.rgb(255, 251, 254),
            Color.rgb(231, 224, 236),
            Color.rgb(29, 27, 32),
            Color.rgb(73, 69, 79),
            primary,
            readableText(primary),
            Color.rgb(121, 116, 126),
            Color.rgb(186, 26, 26)
        );
    }

    private int systemColor(String name, int fallback) {
        int id = getResources().getIdentifier(name, "color", "android");
        if (id == 0) return fallback;
        return getColor(id);
    }

    private int readableText(int color) {
        double luminance = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255;
        return luminance > 0.56 ? Color.rgb(29, 27, 32) : Color.WHITE;
    }

    private void applySystemBars(UiColors colors) {
        getWindow().setStatusBarColor(colors.background);
        getWindow().setNavigationBarColor(colors.background);
        int flags = 0;
        if (isLight(colors.background) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        }
        if (isLight(colors.background) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }
        getWindow().getDecorView().setSystemUiVisibility(flags);
    }

    private boolean isLight(int color) {
        double luminance = (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255;
        return luminance > 0.56;
    }

    private static class UiColors {
        final int background;
        final int surface;
        final int surfaceVariant;
        final int onSurface;
        final int onSurfaceVariant;
        final int primary;
        final int onPrimary;
        final int outline;
        final int error;

        UiColors(int background, int surface, int surfaceVariant, int onSurface, int onSurfaceVariant, int primary, int onPrimary, int outline, int error) {
            this.background = background;
            this.surface = surface;
            this.surfaceVariant = surfaceVariant;
            this.onSurface = onSurface;
            this.onSurfaceVariant = onSurfaceVariant;
            this.primary = primary;
            this.onPrimary = onPrimary;
            this.outline = outline;
            this.error = error;
        }
    }

    private class AndroidBridge {
        @JavascriptInterface
        public void changeServer() {
            runOnUiThread(() -> clearServerAndShowSetup());
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) return;

        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        }
        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
