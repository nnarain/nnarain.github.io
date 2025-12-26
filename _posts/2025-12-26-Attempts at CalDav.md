---
layout: post
title: Attempts at CalDav
tag: [caldav, python]
repo: nnarain/plane-caldav-server
project_id: homelab
---

As mentioned in a [previous post]({% post_url 2025-10-13-The Great Homelab Renaissance %}), I'm working on overhauling my homelab. This includes spending too much time setting up a new todo app.

I decided trying to use the [plane product management app](https://plane.so/). It is very similar to JIRA which I actually like. However the mobile app provided by Plane only works for the commericial version. Apparently it used to work on the free edition, so I'm not a huge fan of that.

Looking for alternate options, I thought I could try using a generic todo app with caldav support and proxy the Plane task through a custom caldav server. CalDav supports tasks, so it is a good generic option.

There are 3 main parts to this proxy server:

* reading the plane API
* writing the plane tasks to an ics file
* serving the ics files over a caldav server

## Reading tasks from plane

Ofcourse plane has a rest API. I started by creating a wrapper for it using requests

```python
class PlaneAPI:
    def __init__(self, url, api_key):
        self.api_key = api_key
        self._base_api_url = f"{url}/api/v1"

    def get_projects(self, workspace):
        json = self.get_projects_json(workspace)

        projects = []
        for project in json["results"]:
            project_id = project.get("id")
            project_name = project.get("name")

            projects.append({"id": project_id, "name": project_name})

        return projects

    def get_projects_json(self, workspace):
        url = f"{self._base_api_url}/workspaces/{workspace}/projects"
        headers = self._create_headers()
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()

    def get_work_items(self, workspace, project_id):
        json = self.get_work_items_json(workspace, project_id)

        work_items = []
        for item in json["results"]:
            item_id = item.get("id")
            item_name = item.get("name")
            description = item.get("description_stripped")
            target_date = item.get("target_date")
            completed_at = item.get("completed_at")

            work_items.append(
                {
                    "id": item_id,
                    "name": item_name,
                    "description": description,
                    "target_date": target_date,
                    "completed_at": completed_at,
                }
            )

        return work_items

    def get_work_items_json(self, workspace, project_id):
        url = self._get_work_items_endpoint(workspace, project_id)
        headers = self._create_headers()
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()

    def _create_headers(self):
        return {"X-API-Key": f"{self.api_key}"}

    def _get_work_items_endpoint(self, workspace, project):
        return f"{self._base_api_url}/workspaces/{workspace}/projects/{project}/work-items"
```

## Writing to an icalendar file

The tasks have to be written to a icalendar file. This is done using the `icalendar` python library.

```python
def create_todo(
    summary: str,
    description: str = "",
    priority: int = 0,
    status: str = "NEEDS-ACTION",
    due: datetime = None,
    uid: str = None,
) -> Calendar:
    """
    Create a TODO calendar component.

    Args:
        summary: Todo title/summary
        description: Todo description
        priority: Priority (0=undefined, 1=highest, 9=lowest)
        status: Status (NEEDS-ACTION, COMPLETED, IN-PROCESS, CANCELLED)
        due: Due date
        uid: Unique identifier (auto-generated if not provided)

    Returns:
        Calendar object containing the TODO
    """
    cal = Calendar()
    cal.add("prodid", "-//Plane CalDAV Server//EN")
    cal.add("version", "2.0")

    todo = Todo()
    todo.add("summary", summary)

    if description:
        todo.add("description", description)

    if priority:
        todo.add("priority", priority)

    todo.add("status", status)

    if due:
        todo.add("due", due)

    # Add UID and timestamp
    todo.add("uid", uid or str(uuid.uuid4()))
    todo.add("dtstamp", datetime.now())

    cal.add_component(todo)
    return cal


def save_todo_to_file(calendar: Calendar, calendar_path: Path, filename: str = None) -> Path:
    """
    Save a TODO calendar to a file in the calendar collection.

    Args:
        calendar: Calendar object containing the TODO
        calendar_path: Path to the calendar collection directory
        filename: Filename to use (auto-generated if not provided)

    Returns:
        Path to the saved file
    """
    if filename is None:
        # Extract UID from the TODO component
        todo_component = None
        for component in calendar.walk():
            if component.name == "VTODO":
                todo_component = component
                break

        if todo_component and "uid" in todo_component:
            uid = str(todo_component["uid"])
            filename = f"{uid}.ics"
        else:
            filename = f"{uuid.uuid4()}.ics"

    file_path = calendar_path / filename
    file_path.write_bytes(calendar.to_ical())
    return file_path


def add_todo_to_calendar(
    calendar_path: Path,
    summary: str,
    description: str = "",
    priority: int = 0,
    status: str = "NEEDS-ACTION",
    due: datetime = None,
    uid: str = None,
) -> Path:
    """
    Create and save a TODO to a calendar collection.

    Args:
        calendar_path: Path to the calendar collection directory
        summary: Todo title/summary
        description: Todo description
        priority: Priority (0=undefined, 1=highest, 9=lowest)
        status: Status (NEEDS-ACTION, COMPLETED, IN-PROCESS, CANCELLED)
        due: Due date
        uid: Unique identifier (auto-generated if not provided)

    Returns:
        Path to the saved TODO file
    """
    cal = create_todo(summary, description, priority, status, due, uid)
    return save_todo_to_file(cal, calendar_path)
```


## Bringing up a CalDav server

The core of this is the library `radicale`, which can bring up a caldav server.

```python
class PlaneCalDAVApplication(Application):
    """Custom CalDAV application that syncs with Plane on GET and POST requests."""

    def __init__(self, configuration, sync_manager: Optional[SyncManager] = None):
        """
        Initialize the custom application.

        Args:
            configuration: Radicale configuration
            sync_manager: Optional sync manager for Plane integration
        """
        super().__init__(configuration)
        self.sync_manager = sync_manager

    def do_GET(
        self, 
        environ: Mapping[str, Any], 
        base_prefix: str, 
        path: str, 
        user: str,
        *args,
        **kwargs
    ) -> Tuple[int, Mapping[str, str], Iterable[bytes]]:
        """
        Handle GET requests with sync before fetching data.

        Args:
            environ: WSGI environment
            base_prefix: Base URL prefix
            path: Request path
            user: Authenticated user
            *args: Additional positional arguments
            **kwargs: Additional keyword arguments

        Returns:
            Tuple of (status_code, headers, body)
        """
        # Sync before handling GET request
        if self.sync_manager:
            self.sync_manager.sync()

        # Call parent implementation
        return super().do_GET(environ, base_prefix, path, user, *args, **kwargs)

    def do_POST(
        self,
        environ: Mapping[str, Any],
        base_prefix: str,
        path: str,
        user: str,
        *args,
        **kwargs
    ) -> Tuple[int, Mapping[str, str], Iterable[bytes]]:
        """
        Handle POST requests with sync before updating data.

        Args:
            environ: WSGI environment
            base_prefix: Base URL prefix
            path: Request path
            user: Authenticated user
            *args: Additional positional arguments
            **kwargs: Additional keyword arguments

        Returns:
            Tuple of (status_code, headers, body)
        """
        # Sync before handling POST request
        if self.sync_manager:
            self.sync_manager.sync()

        # Call parent implementation
        return super().do_POST(environ, base_prefix, path, user, *args, **kwargs)
```

A caldav application is created to manage HTTP GET and POST requests.

the caldav server itself is brought up with `httpd`

```python
def run_server(args, sync_manager=None):
    """Start the CalDAV server with the given configuration."""
    # Use the load function to create a proper configuration
    configuration = config.load()

    # Override storage folder and authentication
    configuration.update(
        {
            "storage": {"filesystem_folder": args.storage_folder},
            "auth": {
                "type": "htpasswd",
                "htpasswd_filename": args.htpasswd_file,
                "htpasswd_encryption": "md5",
            },
        },
        "custom config",
    )

    app = PlaneCalDAVApplication(configuration, sync_manager)

    with make_server(args.host, args.port, app) as httpd:
        print(f"Serving on {args.host}:{args.port}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        print("Server stopped.")
```


## Results

I managed to get the plane tasks into the ical file and visualized using Thunderbird as the caldav client. However integrating it into an aandriod caldav turned out to be quite problematic as android enforces HTTPS. I tried running it through an HTTPS proxy but no luck.

Unfortunately this idea didn't work out but might be worth looking into in the future.
